package com.management.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String baseUploadDir; // usually "uploads"

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        List<String> dynamicPrefixes = List.of("shop-user-images", "service-images", "customer-before-after-photos");

        for (String prefix : dynamicPrefixes) {
            registry.addResourceHandler("/" + prefix + "/**")
                    .addResourceLocations("file:" + baseUploadDir + "/" + prefix + "/");
        }
    }
}
