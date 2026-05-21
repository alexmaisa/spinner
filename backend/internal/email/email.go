package email

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

// Config holds SMTP configuration loaded from environment variables.
type Config struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

// LoadConfig reads SMTP settings from environment variables.
func LoadConfig() *Config {
	return &Config{
		Host:     getEnv("SMTP_HOST", "localhost"),
		Port:     getEnv("SMTP_PORT", "1025"),
		Username: getEnv("SMTP_USERNAME", ""),
		Password: getEnv("SMTP_PASSWORD", ""),
		From:     getEnv("SMTP_FROM", "noreply@spinner.local"),
	}
}

// SendMagicLink delivers a magic login link email to the specified address.
func SendMagicLink(cfg *Config, toEmail, magicToken, baseURL string) error {
	verifyURL := fmt.Sprintf("%s/api/auth/verify?token=%s", strings.TrimRight(baseURL, "/"), magicToken)

	subject := "Sign in to Spinner"
	htmlBody := buildMagicLinkHTML(verifyURL)

	// Construct the email message with MIME headers
	msg := fmt.Sprintf(
		"From: Spinner <%s>\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\"\r\n"+
			"\r\n%s",
		cfg.From, toEmail, subject, htmlBody,
	)

	addr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)

	// Use authentication only if credentials are provided
	var auth smtp.Auth
	if cfg.Username != "" && cfg.Password != "" {
		auth = smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	}

	err := smtp.SendMail(addr, auth, cfg.From, []string{toEmail}, []byte(msg))
	if err != nil {
		log.Printf("SMTP Error: Failed to send magic link to %s: %v", toEmail, err)
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("SMTP: Magic link sent successfully to %s", toEmail)
	return nil
}

// buildMagicLinkHTML constructs a styled HTML email body for the magic login link.
func buildMagicLinkHTML(verifyURL string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#0a0e1a; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0a0e1a; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, rgba(15,20,35,0.95), rgba(20,28,50,0.95)); border:1px solid rgba(139,92,246,0.3); border-radius:16px; padding:40px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px; font-weight:800; background:linear-gradient(135deg, #22d3ee, #8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">✨ SPINNER</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <h2 style="color:#e2e8f0; font-size:22px; margin:0;">Sign in to Spinner</h2>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="color:#94a3b8; font-size:14px; line-height:1.6; margin:0;">
                Click the button below to securely sign in to your Spinner account. This link is valid for <strong style="color:#e2e8f0;">15 minutes</strong> and can only be used once.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="%s" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg, #8b5cf6, #6d28d9); color:#ffffff; text-decoration:none; font-size:16px; font-weight:600; border-radius:10px; letter-spacing:0.5px;">
                Sign In to Spinner
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <p style="color:#64748b; font-size:12px; margin:0;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="border-top:1px solid rgba(255,255,255,0.06); padding-top:20px;">
              <p style="color:#475569; font-size:11px; margin:0;">
                Spinner — Free, Lightweight & Ad-Free Randomizer
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, verifyURL)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
