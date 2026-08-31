
import os
import smtplib
from email.message import EmailMessage


def send_email(
    to_email: str,
    subject: str,
    body: str
) -> dict:
    """
    Send an email using Gmail SMTP.

    Args:
        to_email: Customer email address.
        subject: Email subject.
        body: Email body.

    Returns:
        Result of the email operation.
    """

    # Read configuration at runtime.
    # Cloud Run will provide these environment variables.
    GMAIL_USERNAME = os.getenv("GMAIL_USERNAME")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

    # Validate Gmail username
    if not GMAIL_USERNAME:
        return {
            "success": False,
            "error": "GMAIL_USERNAME is not configured"
        }

    # Validate Gmail app password
    if not GMAIL_APP_PASSWORD:
        return {
            "success": False,
            "error": "GMAIL_APP_PASSWORD is not configured"
        }

    try:
        message = EmailMessage()

        message["From"] = GMAIL_USERNAME
        message["To"] = to_email
        message["Subject"] = subject

        message.set_content(body)

        # Connect to Gmail SMTP
        with smtplib.SMTP(
            "smtp.gmail.com",
            587
        ) as server:

            server.starttls()

            server.login(
                GMAIL_USERNAME,
                GMAIL_APP_PASSWORD
            )

            server.send_message(message)

        return {
            "success": True,
            "message": "Email sent successfully",
            "to": to_email
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }