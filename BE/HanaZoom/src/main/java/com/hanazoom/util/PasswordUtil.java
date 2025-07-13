package com.hanazoom.util;

import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class PasswordUtil {

    private static final String HASH_ALGORITHM = "SHA-256";
    private static final int SALT_LENGTH = 16;

    public String encodePassword(String rawPassword) {
        try {
            // 솔트 생성
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[SALT_LENGTH];
            random.nextBytes(salt);

            // 비밀번호와 솔트를 결합하여 해시 생성
            String hashedPassword = hashPassword(rawPassword, salt);

            // 솔트와 해시를 Base64로 인코딩하여 저장
            String saltString = Base64.getEncoder().encodeToString(salt);
            return saltString + ":" + hashedPassword;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("비밀번호 암호화 중 오류가 발생했습니다.", e);
        }
    }

    public boolean matches(String rawPassword, String encodedPassword) {
        try {
            // 저장된 비밀번호에서 솔트와 해시 분리
            String[] parts = encodedPassword.split(":");
            if (parts.length != 2) {
                return false;
            }

            String saltString = parts[0];
            String storedHash = parts[1];

            // 솔트 디코딩
            byte[] salt = Base64.getDecoder().decode(saltString);

            // 입력된 비밀번호를 같은 솔트로 해시
            String inputHash = hashPassword(rawPassword, salt);

            // 해시 비교
            return storedHash.equals(inputHash);
        } catch (Exception e) {
            return false;
        }
    }

    private String hashPassword(String password, byte[] salt) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance(HASH_ALGORITHM);
        md.update(salt);
        byte[] hashedBytes = md.digest(password.getBytes());
        return Base64.getEncoder().encodeToString(hashedBytes);
    }
}