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
		File envFile = new File(".env");
		if (!envFile.exists()) {
			envFile = new File("../.env");
		}
		if (envFile.exists()) {
			try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
				String line;
				while ((line = reader.readLine()) != null) {
					line = line.trim();
					if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
						int eqIdx = line.indexOf('=');
						String key = line.substring(0, eqIdx).trim();
						String value = line.substring(eqIdx + 1).trim();
						if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						} else if (value.startsWith("'") && value.endsWith("'") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						}
						if (System.getProperty(key) == null && System.getenv(key) == null) {
							System.setProperty(key, value);
						}
					}
				}
			} catch (IOException ignored) {
			}
		}
	}
}
