package com.management.service;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.ui.freemarker.FreeMarkerTemplateUtils;

import com.management.exception.BusinessException;
import com.management.exception.EmailSendingException;

import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateNotFoundException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

	@Autowired
	private JavaMailSender mailSender;
	
	@Autowired
    private Configuration freemarkerConfig;
	
	@Value("${app.mail.from}")
	private String fromEmail;

	public void sendTemplatedEmail(String to, String subject, Map<String, Object> model, String templateName, String cc)
			{
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true);

			Template template = freemarkerConfig.getTemplate(templateName);
			String html = FreeMarkerTemplateUtils.processTemplateIntoString(template, model);

			helper.setTo(to);
			helper.setSubject(subject);
			helper.setFrom(fromEmail);
			helper.setText(html, true); // true = isHtml
			
			if (cc != null && !cc.trim().isEmpty()) {
                helper.setCc(cc);  // Adds CC if the email is not null or empty
            }

			mailSender.send(message);
		} catch (TemplateNotFoundException e) {
			throw new BusinessException("Email template not found.", HttpStatus.BAD_REQUEST);
		}
		catch(IOException | TemplateException | MessagingException e) {
			throw new EmailSendingException("Unable to send email", HttpStatus.SERVICE_UNAVAILABLE);
		}
		
	
	}

}
