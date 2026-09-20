<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f4f6; font-family: Arial, sans-serif; color: #333;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin-top: 40px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #4a90e2; padding: 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Salon CRM</h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="margin-top: 0;">Hello ${name!"User"},</h2>
                            <p>We received a request to verify your identity using a One-Time Password (OTP).</p>

                            <p style="margin-bottom: 5px;"><strong>Your OTP:</strong></p>
                            <div style="font-size: 28px; font-weight: bold; color: #4a4a4a; background-color: #f0f4ff; padding: 15px 30px; text-align: center; border-radius: 6px; letter-spacing: 3px; margin: 10px 0;">
                                ${otp!"----"}
                            </div>

                            <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone for security reasons.</p>

                            <p>If you did not request this OTP, you can safely ignore this email. Otherwise, use the OTP to continue your process.</p>

                            <p style="margin-top: 40px;">Thanks,<br><strong>Salon CRM Team</strong></p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7f7f7; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                            © ${.now?string("yyyy")} Salon CRM. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
