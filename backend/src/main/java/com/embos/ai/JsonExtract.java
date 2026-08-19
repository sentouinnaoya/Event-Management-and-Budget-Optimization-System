package com.embos.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public final class JsonExtract {

    private JsonExtract() {
    }

    /**
     * Scans {@code text} for the first balanced JSON object that contains {@code requiredKey}
     * and returns that exact substring. When {@code requiredKey} is {@code null}, returns the
     * first balanced JSON object found, falling back to a strict parse of the trimmed text.
     * Returns "" when nothing usable is found.
     */
    public static String findObject(ObjectMapper objectMapper, String text, String requiredKey) {
        if (text == null) {
            return "";
        }
        int i = 0;
        while (i < text.length()) {
            int open = text.indexOf('{', i);
            if (open < 0) {
                break;
            }
            int end = matchingBrace(text, open);
            if (end < 0) {
                break;
            }
            String candidate = text.substring(open, end + 1);
            try {
                JsonNode node = objectMapper.readTree(candidate);
                if (node.isObject()) {
                    if (requiredKey != null) {
                        if (node.has(requiredKey)) {
                            return candidate;
                        }
                    } else {
                        return candidate;
                    }
                }
            } catch (Exception ignored) {
                // malformed candidate; keep scanning
            }
            i = open + 1;
        }
        if (requiredKey != null) {
            return "";
        }
        String trimmed = text.trim();
        try {
            objectMapper.readTree(trimmed);
            return trimmed;
        } catch (Exception e) {
            return "";
        }
    }

    private static int matchingBrace(String text, int open) {
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int idx = open; idx < text.length(); idx++) {
            char c = text.charAt(idx);
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (c == '\\') {
                    escaped = true;
                } else if (c == '"') {
                    inString = false;
                }
                continue;
            }
            if (c == '"') {
                inString = true;
            } else if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return idx;
                }
            }
        }
        return -1;
    }
}
