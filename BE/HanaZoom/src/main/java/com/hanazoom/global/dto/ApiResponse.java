package com.hanazoom.global.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ApiResponse<T> {
    private T data;
    private String message;
    private String error;

    public ApiResponse(T data) {
        this.data = data;
    }

    public ApiResponse(T data, String message) {
        this.data = data;
        this.message = message;
    }

    public static <T> ApiResponse<T> error(String error) {
        ApiResponse<T> response = new ApiResponse<>();
        response.error = error;
        return response;
    }
}