package com.management.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.management.constant.Constants;
import com.management.exception.BusinessException;
import com.management.service.impl.MessageService;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Component
public class PhotoUtil {

    private static final Logger logger = LoggerFactory.getLogger(PhotoUtil.class);

    // Allowed file extensions
    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png");
     
    /**
     * Saves the uploaded photo to the given upload directory with a unique name,
     * and returns the corresponding public-facing URL with the provided prefix.
     *
     * @param file             the uploaded MultipartFile
     * @param uploadDir        absolute or relative path where file should be saved
     * @param urlPrefix        public-facing prefix for access (e.g., /shop-user-images/)
     * @param username         the user or entity for whom/service the photo is being saved
     * @param messageService   message service
     * @return the constructed photo URL, or null if file is missing
     */
    public static String savePhoto(
            MultipartFile file,
            String urlPrefix,
            String baseUploadDir,
            String username, MessageService messageService) {
        logger.info("Validating photo for username/servicename: {}", username);

		if (Constants.PREFIX_URL_SHP_USR.equals(urlPrefix)) {
			if (file == null || file.isEmpty()) {
				logger.warn("Photo is not present for: {}", username);
				return null;
			}
		} else {
			if (file == null || file.isEmpty()) {

				if (file == null || file.isEmpty()) {
					logger.error("Photo is not present for: {}", username);
					throw new BusinessException("Please upload photo for service.", HttpStatus.BAD_REQUEST);
				}
			}
		}

        try {
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);

            if (fileExtension == null || !ALLOWED_EXTENSIONS.contains(fileExtension.toLowerCase())) {
                throw new BusinessException(
                        messageService.getMessage("MSG039_INVALID_FILE_TYPE"),
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE
                );
            }

            String fileName = "photo_"+ username  + System.currentTimeMillis() + "_" + UUID.randomUUID() + "." + fileExtension;

            String cleanedSubDir = urlPrefix.replaceAll("^/+|/+$", ""); // remove leading/trailing slashes
            Path uploadPath = Paths.get(baseUploadDir, cleanedSubDir);
            if (Files.notExists(uploadPath)) {
                try {
                    Files.createDirectories(uploadPath);
                    logger.info("Created upload directory: {}", uploadPath.toAbsolutePath());
                } catch (IOException e) {
                    logger.error("Failed to create upload directory: {}", uploadPath.toAbsolutePath(), e);
                    throw new BusinessException(
                            messageService.getMessage("MSG036_UPLOAD_DIR_CREATION_FAILED", new Object[]{uploadPath}),
                            HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            } else {
                logger.debug("Upload directory already exists: {}", uploadPath.toAbsolutePath());
            }

            Path filePath = uploadPath.resolve(fileName);
            Files.write(filePath, file.getBytes());

            String photoUrl = urlPrefix + fileName;
            logger.info("Setting photo url {} for username: {}", photoUrl, username);
            return photoUrl;

        } catch (IOException e) {
            logger.error("Error while saving photo for {}: {}", username, e.getMessage());
            throw new BusinessException(
                    messageService.getMessage("MSG037_PHOTO_SAVE_FAILED"),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private static String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return null;
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
