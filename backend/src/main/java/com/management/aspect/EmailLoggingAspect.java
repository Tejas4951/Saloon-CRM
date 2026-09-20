package com.management.aspect;

import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component // Marks this as a Spring component
@Aspect    // Marks this as an aspect for AOP
public class EmailLoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(EmailLoggingAspect.class);

    // Define the pointcut: where you want AOP to apply (in this case, any method in EmailService class)
    @Pointcut("execution(public * com.management.service.EmailService.sendTemplatedEmail(..))")
    public void emailServiceMethods() {}

    // Before the email is sent, log a message
    @Before("emailServiceMethods()")
    public void logBeforeEmailSending() {
        logger.debug("Preparing to send email...");
    }

    // After the email is sent, log a message
    @After("emailServiceMethods()")
    public void logAfterEmailSending() {
        logger.info("Email sent successfully.");
    }
}
