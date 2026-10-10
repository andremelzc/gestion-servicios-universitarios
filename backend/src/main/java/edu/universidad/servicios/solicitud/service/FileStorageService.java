package edu.universidad.servicios.solicitud.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class FileStorageService {

	private final Path root;

	public FileStorageService(
		@Value(
			"${app.storage.path:${STORAGE_PATH:/tmp/gestion-servicios/evidencias}}"
		) String storagePath
	) {
		try {
			root = Path.of(storagePath).toAbsolutePath().normalize();
			Files.createDirectories(root);
			if (!Files.isWritable(root)) {
				throw new IllegalStateException(
					"La ruta de almacenamiento no es escribible: " + root
				);
			}
		} catch (IOException exception) {
			throw new IllegalStateException(
				"No se pudo inicializar el almacenamiento de evidencias",
				exception
			);
		}
	}

	public StoredFile store(FileTypeValidator.ValidatedFile file) {
		String extension = extension(file.originalName());
		if (!extension.matches("jpg|jpeg|png|pdf")) {
			throw new IllegalArgumentException(
				"Tipo de archivo almacenado inválido"
			);
		}
		String storedName = UUID.randomUUID() + "." + extension;
		Path destination = resolveStoredName(storedName);
		try {
			Files.write(
				destination,
				file.content(),
				StandardOpenOption.CREATE_NEW,
				StandardOpenOption.WRITE
			);
			return new StoredFile(storedName, storedName);
		} catch (IOException exception) {
			throw new IllegalStateException(
				"No se pudo almacenar la evidencia",
				exception
			);
		}
	}

	public void delete(String storedName) {
		try {
			Files.deleteIfExists(resolveStoredName(storedName));
		} catch (IOException exception) {
			throw new IllegalStateException(
				"No se pudo eliminar la evidencia almacenada",
				exception
			);
		}
	}

	private Path resolveStoredName(String storedName) {
		if (
			storedName == null ||
			!storedName.matches("[a-fA-F0-9-]{36}\\.(jpg|jpeg|png|pdf)")
		) {
			throw new IllegalArgumentException(
				"Nombre de archivo almacenado inválido"
			);
		}
		Path destination = root.resolve(storedName).normalize();
		if (!destination.startsWith(root)) {
			throw new IllegalArgumentException(
				"La ruta del archivo almacenado está fuera del almacenamiento"
			);
		}
		return destination;
	}

	private String extension(String originalName) {
		int dot = originalName.lastIndexOf('.');
		return originalName
			.substring(dot + 1)
			.toLowerCase(java.util.Locale.ROOT);
	}

	public record StoredFile(String storedName, String relativePath) {}
}
