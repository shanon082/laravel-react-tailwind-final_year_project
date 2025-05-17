<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(to right, #3b82f6, #6366f1);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 8px 8px;
        }
        .feedback-section {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
        }
        .response-section {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Feedback Response</h2>
    </div>
    
    <div class="content">
        <p>Hello {{ $userName }},</p>
        
        <p>We have reviewed and responded to your feedback in the Timetable System.</p>
        
        <div class="feedback-section">
            <strong>Your Feedback:</strong>
            <p>{{ $feedbackContent }}</p>
        </div>
        
        <div class="response-section">
            <strong>Our Response:</strong>
            <p>{{ $responseContent }}</p>
        </div>
        
        <p>Thank you for helping us improve the system. If you have any additional feedback or questions, please don't hesitate to submit another feedback through the system.</p>
        
        <p>Best regards,<br>Admin Team</p>
    </div>
</body>
</html> 