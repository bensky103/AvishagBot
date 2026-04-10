from datetime import date, datetime, timedelta
from typing import Optional

from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import task_service, supplier_service, issue_service


def get_agent_tools(session: AsyncSession) -> list:
    """Create tool functions bound to a specific database session."""

    @tool
    async def create_task(
        title: str,
        description: str = "",
        due_date: str = "",
        urgency: str = "medium",
    ) -> str:
        """Create a new task. urgency must be one of: low, medium, high, critical. due_date format: YYYY-MM-DD."""
        parsed_date = None
        if due_date:
            parsed_date = date.fromisoformat(due_date)
        t = await task_service.create_task(
            session, title=title, description=description or None,
            due_date=parsed_date, urgency=urgency,
        )
        return f"Task created: id={t.id}, title='{t.title}', urgency={t.urgency}, due={t.due_date}"

    @tool
    async def list_tasks(
        status: str = "",
        urgency: str = "",
        due_before: str = "",
    ) -> str:
        """List tasks with optional filters. status: 'open' or 'completed'. urgency: low/medium/high/critical. due_before: YYYY-MM-DD."""
        parsed_date = date.fromisoformat(due_before) if due_before else None
        tasks = await task_service.list_tasks(
            session,
            status=status or None,
            urgency=urgency or None,
            due_before=parsed_date,
        )
        if not tasks:
            return "No tasks found matching the filters."
        lines = []
        for t in tasks:
            status_mark = "✅" if t.is_completed else "⬜"
            lines.append(f"{status_mark} [{t.id}] {t.title} (urgency={t.urgency}, due={t.due_date})")
        return "\n".join(lines)

    @tool
    async def complete_task(task_id: int) -> str:
        """Mark a task as completed."""
        t = await task_service.complete_task(session, task_id)
        return f"Task {t.id} '{t.title}' marked as completed."

    @tool
    async def create_supplier(name: str, contact_info: str = "") -> str:
        """Register a new supplier."""
        s = await supplier_service.create_supplier(session, name=name, contact_info=contact_info or None)
        return f"Supplier created: id={s.id}, name='{s.name}'"

    @tool
    async def list_suppliers() -> str:
        """List all registered suppliers."""
        suppliers = await supplier_service.list_suppliers(session)
        if not suppliers:
            return "No suppliers registered."
        lines = [f"[{s.id}] {s.name} (contact: {s.contact_info or 'N/A'})" for s in suppliers]
        return "\n".join(lines)

    @tool
    async def create_issue_report(
        supplier_name: str,
        product_name: str,
        problem_description: str,
        arrival_date: str = "",
        sku: str = "",
    ) -> str:
        """Create an issue report for a supplier problem. supplier_name is matched fuzzily against existing suppliers. arrival_date format: YYYY-MM-DD (defaults to today)."""
        suppliers = await supplier_service.list_suppliers(session)
        matched = None
        for s in suppliers:
            if supplier_name in s.name or s.name in supplier_name:
                matched = s
                break
        if not matched:
            return f"Supplier '{supplier_name}' not found. Available suppliers: {', '.join(s.name for s in suppliers)}"

        parsed_date = date.fromisoformat(arrival_date) if arrival_date else date.today()
        issue = await issue_service.create_issue_report(
            session, supplier_id=matched.id, product_name=product_name,
            sku=sku or None, arrival_date=parsed_date,
            problem_description=problem_description,
        )
        return f"Issue report created: id={issue.id}, supplier='{matched.name}', product='{product_name}', status={issue.status}"

    @tool
    async def list_issues(supplier_name: str = "", status: str = "") -> str:
        """List issue reports with optional filters. status: open/in_progress/resolved."""
        supplier_id = None
        if supplier_name:
            suppliers = await supplier_service.list_suppliers(session)
            for s in suppliers:
                if supplier_name in s.name or s.name in supplier_name:
                    supplier_id = s.id
                    break

        issues = await issue_service.list_issue_reports(
            session, supplier_id=supplier_id, status=status or None,
        )
        if not issues:
            return "No issues found matching the filters."
        lines = []
        for i in issues:
            action_count = len(i.action_items) if i.action_items else 0
            done_count = sum(1 for a in i.action_items if a.is_completed) if i.action_items else 0
            lines.append(
                f"[{i.id}] {i.product_name} (supplier_id={i.supplier_id}, status={i.status}, "
                f"actions={done_count}/{action_count}, date={i.arrival_date})"
            )
        return "\n".join(lines)

    @tool
    async def add_action_item(
        issue_report_id: int,
        description: str,
        create_task: bool = False,
    ) -> str:
        """Add an action item to an issue report. Set create_task=True to also create a linked task in the TODO list."""
        action = await issue_service.add_action_item(
            session, issue_report_id=issue_report_id,
            description=description, create_task=create_task,
        )
        task_info = f", linked task_id={action.task_id}" if action.task_id else ""
        return f"Action item created: id={action.id}, description='{description}'{task_info}"

    @tool
    async def resolve_issue(issue_report_id: int) -> str:
        """Mark an issue report as resolved."""
        issue = await issue_service.resolve_issue_report(session, issue_report_id)
        return f"Issue {issue.id} marked as resolved."

    return [
        create_task, list_tasks, complete_task,
        create_supplier, list_suppliers,
        create_issue_report, list_issues,
        add_action_item, resolve_issue,
    ]
