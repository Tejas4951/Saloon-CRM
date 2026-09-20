<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #6C63FF;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h2 {
            margin: 0;
            font-size: 26px;
        }
        .content {
            padding: 25px 20px;
        }
        .content p {
            font-size: 16px;
            color: #333;
            line-height: 1.5;
        }
        .content strong {
            color: #000;
        }
        .cta-button {
            display: inline-block;
            margin-top: 20px;
            background-color: #6C63FF;
            color: #fff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            background-color: #fafafa;
            text-align: center;
            padding: 15px;
            font-size: 14px;
            color: #888;
        }
        .footer a {
            color: #6C63FF;
            text-decoration: none;
        }
        .footer div {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 15px;
        }
        .footer img {
            width: 40px;
            vertical-align: middle;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome, ${name}!</h2>
        </div>
        <div class="content">
            <p>We're excited to have you on board. Here's what you need to get started:</p>
            <p><strong>Username:</strong> ${userName}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
            <a href="http://192.168.0.106:3000/" class="cta-button">Login Now</a>
            <p style="margin-top: 25px;">If you have any questions, feel free to reach out anytime.</p>
            <p>Best regards,<br><strong>Salon Platform Team</strong></p>
        </div>
        <div class="footer">
            <p>
                <a href="http://www.salonplatform.com">Visit our website</a> | 
                <strong>Salon Platform</strong> &copy; 2025
            </p>
            <div>
                <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Welcome Icon">
                <span>Welcome to Salon Platform!</span>
            </div>
        </div>
    </div>
</body>
</html>
