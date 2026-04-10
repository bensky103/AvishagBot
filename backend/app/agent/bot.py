import structlog
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

from app.config import settings
from app.database import async_session
from app.agent.agent import run_agent

logger = structlog.get_logger("telegram")


MAX_HISTORY_MESSAGES = 20


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming Telegram messages."""
    if update.effective_user.id != settings.telegram_allowed_user_id:
        logger.warning("unauthorized_user", user_id=update.effective_user.id)
        return

    user_message = update.message.text
    logger.info("message_received", text=user_message[:100])

    # Retrieve conversation history from context (in-memory, per user)
    if "history" not in context.user_data:
        context.user_data["history"] = []
    history = context.user_data["history"]

    async with async_session() as session:
        try:
            response = await run_agent(session, user_message, history=history)

            # Append this exchange to history for next turn
            history.append(("human", user_message))
            history.append(("ai", response))

            # Trim to keep context window manageable
            if len(history) > MAX_HISTORY_MESSAGES * 2:
                history[:] = history[-(MAX_HISTORY_MESSAGES * 2):]

            await update.message.reply_text(response)
            logger.info("response_sent", length=len(response))
        except Exception as e:
            logger.error("agent_error", error=str(e))
            await update.message.reply_text("שגיאה בעיבוד ההודעה. נסי שוב.")


def create_bot_application() -> Application:
    """Create the Telegram bot application."""
    return (
        Application.builder()
        .token(settings.telegram_bot_token)
        .build()
    )


async def start_bot() -> Application:
    """Initialize and start the Telegram bot polling."""
    application = create_bot_application()
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    await application.initialize()
    await application.start()
    await application.updater.start_polling(drop_pending_updates=True)
    logger.info("bot_started")
    return application


async def stop_bot(application: Application) -> None:
    """Stop the Telegram bot."""
    await application.updater.stop()
    await application.stop()
    await application.shutdown()
    logger.info("bot_stopped")
