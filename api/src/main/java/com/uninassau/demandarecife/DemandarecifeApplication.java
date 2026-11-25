package com.uninassau.demandarecife;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

@SpringBootApplication
@EnableScheduling
public class DemandarecifeApplication {

	public static void main(String[] args) {
		loadDotenv();
		SpringApplication.run(DemandarecifeApplication.class, args);
	}

	private static void loadDotenv() {
		// Tenta múltiplos caminhos para encontrar o .env
		File envFile = findEnvFile();
		if (envFile == null) return;

		try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
			String line;
			while ((line = reader.readLine()) != null) {
				line = line.trim();
				if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) continue;

				int eqIdx = line.indexOf('=');
				String key = line.substring(0, eqIdx).trim();
				String value = line.substring(eqIdx + 1).trim();

				// Remove aspas
				if ((value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2)
						|| (value.startsWith("'") && value.endsWith("'") && value.length() >= 2)) {
					value = value.substring(1, value.length() - 1);
				}

				if (value.isBlank()) continue;

				// Só sobrescreve via setProperty se a variável de ambiente real
				// estiver ausente OU estiver em branco (IntelliJ pode injetar strings vazias)
				String existingEnv = System.getenv(key);
				String existingProp = System.getProperty(key);
				boolean envMissing = (existingEnv == null || existingEnv.isBlank());
				boolean propMissing = (existingProp == null || existingProp.isBlank());

				if (envMissing && propMissing) {
					System.setProperty(key, value);
					System.out.println("[dotenv] Loaded: " + key + " from " + envFile.getName());
				}
			}
		} catch (IOException ignored) {
		}
	}

	private static File findEnvFile() {
		String[] candidates = {".env", "api/.env", "../.env", "../../.env"};
		for (String candidate : candidates) {
			File f = new File(candidate);
			if (f.exists()) return f;
		}
		return null;
	}
}
