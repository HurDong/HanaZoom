package com.hanazoom.domain.order.dto;

import com.hanazoom.domain.order.entity.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @NotBlank(message = "종목코드는 필수입니다.")
    @Pattern(regexp = "^\\d{6}$", message = "종목코드는 6자리 숫자여야 합니다.")
    private String stockCode;

    @NotNull(message = "주문 타입은 필수입니다.")
    private Order.OrderType orderType; 

    @NotNull(message = "주문 방법은 필수입니다.")
    private Order.OrderMethod orderMethod; 

    @DecimalMin(value = "0.01", message = "가격은 0.01 이상이어야 합니다.")
    @Digits(integer = 10, fraction = 2, message = "가격은 소수점 2자리까지 입력 가능합니다.")
    private BigDecimal price;

    @NotNull(message = "수량은 필수입니다.")
    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    @Max(value = 1000000, message = "수량은 1,000,000 이하여야 합니다.")
    private Integer quantity;


    public void validateMarketOrder() {


    }


    public BigDecimal getTotalAmount() {
        if (price == null || quantity == null) {
            return BigDecimal.ZERO;
        }
        return price.multiply(BigDecimal.valueOf(quantity));
    }
}
