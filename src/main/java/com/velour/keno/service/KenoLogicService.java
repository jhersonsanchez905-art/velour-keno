package com.velour.keno.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
public class KenoLogicService {
    private final SecureRandom secureRandom = new SecureRandom();
    // Tabla de pagos: PAYTABLE[seleccionados][aciertos] = multiplicador
    private static final int[][] PAYTABLE = {
        // 0 seleccionados (no se usa, índice 0)
        {},
        // 1 seleccionado
        {0, 3},
        // 2 seleccionados
        {0, 0, 9},
        // 3 seleccionados
        {0, 0, 2, 16},
        // 4 seleccionados
        {0, 0, 1, 5, 50},
        // 5 seleccionados
        {0, 0, 0, 3, 12, 100},
        // 6 seleccionados
        {0, 0, 0, 2, 5, 25, 500},
        // 7 seleccionados
        {0, 0, 0, 1, 3, 10, 75, 1000},
        // 8 seleccionados
        {0, 0, 0, 0, 2, 8, 30, 200, 5000},
        // 9 seleccionados
        {0, 0, 0, 0, 1, 5, 15, 100, 1000, 10000},
        // 10 seleccionados
        {0, 0, 0, 0, 0, 3, 10, 50, 500, 5000, 25000}
    };
    /**
    * Genera 20 números únicos del 1 al 80 usando Fisher-Yates shuffle
    * con SecureRandom (estándar criptográfico FIPS 140-2)
    */
    public List<Integer> generateDraw() {
        // Crear lista del 1 al 80
        List<Integer> pool = IntStream.rangeClosed(1, 80)
        .boxed()
        .collect(Collectors.toList());

        // Fisher-Yates shuffle con SecureRandom
        for (int i = pool.size() - 1; i > 0; i--) {
            int j = secureRandom.nextInt(i + 1);
            Collections.swap(pool, i, j);
        }
        // Tomar los primeros 20 y ordenarlos
        List<Integer> drawn = pool.subList(0, 20).stream().sorted().collect(Collectors.toList());
        log.info("Sorteo generado: {}", drawn);
        return drawn;
    }
    /**
     * Calcula los aciertos: intersección entre seleccionados y sorteados
     */
    public int calculateHits(List<Integer> selected, List<Integer> drawn) {
        Set<Integer> drawnSet = new HashSet<>(drawn);
        return (int) selected.stream()
                .filter(drawnSet::contains)
                .count();
    }
    /**
     * Obtiene el multiplicador según la tabla de pagos
     */
    public int getMultiplier(int totalSelected, int hits) {
        if (totalSelected < 1 || totalSelected > 10) {
            return 0;
        }
        if (hits > totalSelected || hits < 0) {
            return 0;
        }
        if (hits >= PAYTABLE[totalSelected].length) {
            return 0;
        }
        return PAYTABLE[totalSelected][hits];
    }
    /**
     * Calcula el premio: apuesta × multiplicador
     */
    public BigDecimal calculatePrize(BigDecimal betAmount, int totalSelected, int hits) {
        int multiplier = getMultiplier(totalSelected, hits);
        return betAmount.multiply(BigDecimal.valueOf(multiplier));
    }
    /**
     * Valida que los números seleccionados sean correctos
     */
    public boolean validateSelection(List<Integer> selected) {
        if (selected == null || selected.isEmpty() || selected.size() > 10) {
            return false;
        }
        // Sin duplicados
        Set<Integer> unique = new HashSet<>(selected);
        if (unique.size() != selected.size()) {
            return false;
        }
        // Todos en rango 1-80
        return selected.stream().allMatch(n -> n >= 1 && n <= 80);
    }
    /**
    * Obtiene la tabla de pagos completa (para el frontend)
    */
    public int[][] getPaytable() {
        return PAYTABLE;
    }

    /**
    * Convierte lista de números a string "3,7,15,22,..."
    */
    public String numbersToString(List<Integer> numbers) {
        return numbers.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    /**
    * Convierte string "3,7,15,22,..." a lista de números
    */
    public List<Integer> stringToNumbers(String numbersStr) {
        if (numbersStr == null || numbersStr.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(numbersStr.split(","))
                .map(String::trim)
                .map(Integer::parseInt)
                .collect(Collectors.toList());
    }
}