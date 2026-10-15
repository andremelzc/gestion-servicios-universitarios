package edu.universidad.servicios.solicitud.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class FileStorageServiceTest {

	@TempDir
	Path tempDir;

	@Test
	void storesWithRandomNameAndCanDelete() throws Exception {
		var storage = new FileStorageService(tempDir.toString());
		var validated = new FileTypeValidator.ValidatedFile(
			"../foto.jpg",
			"image/jpeg",
			4,
			new byte[] { 1, 2, 3, 4 }
		);

		var stored = storage.store(validated);

		assertThat(stored.storedName()).matches("[a-fA-F0-9-]{36}\\.jpg");
		assertThat(Files.exists(tempDir.resolve(stored.storedName()))).isTrue();
		storage.delete(stored.storedName());
		assertThat(
			Files.exists(tempDir.resolve(stored.storedName()))
		).isFalse();
	}

	@Test
	void rejectsPathTraversalWhenDeleting() {
		var storage = new FileStorageService(tempDir.toString());

		assertThrows(IllegalArgumentException.class, () ->
			storage.delete("../outside.jpg")
		);
		assertThrows(IllegalArgumentException.class, () ->
			storage.delete(null)
		);
	}

	@Test
	void failsInitializationWhenStoragePathIsAFile() throws Exception {
		Path storageFile = Files.createFile(tempDir.resolve("not-a-directory"));

		var exception = assertThrows(IllegalStateException.class, () ->
			new FileStorageService(storageFile.toString())
		);

		assertThat(exception.getMessage()).contains("No se pudo inicializar");
	}

	@Test
	void rejectsReadOnlyStorageLocation() {
		assertThat(Files.isWritable(Path.of("/sys"))).isFalse();

		var exception = assertThrows(IllegalStateException.class, () ->
			new FileStorageService("/sys")
		);

		assertThat(exception.getMessage()).contains("no es escribible");
	}

	@Test
	void wrapsStorageWriteFailures() throws Exception {
		Path storagePath = tempDir.resolve("storage");
		var storage = new FileStorageService(storagePath.toString());
		Files.delete(storagePath);
		Files.createFile(storagePath);

		var validated = new FileTypeValidator.ValidatedFile(
			"foto.jpg",
			"image/jpeg",
			1,
			new byte[] { 1 }
		);

		var exception = assertThrows(IllegalStateException.class, () ->
			storage.store(validated)
		);
		assertThat(exception.getMessage()).contains("No se pudo almacenar");
		assertThat(exception.getCause()).isInstanceOf(IOException.class);
	}

	@Test
	void wrapsDeleteFailures() throws Exception {
		var storage = new FileStorageService(tempDir.toString());
		String storedName = "123e4567-e89b-12d3-a456-426614174000.jpg";
		Path nonEmptyDirectory = Files.createDirectory(
			tempDir.resolve(storedName)
		);
		Files.createFile(nonEmptyDirectory.resolve("contenido"));

		var exception = assertThrows(IllegalStateException.class, () ->
			storage.delete(storedName)
		);
		assertThat(exception.getMessage()).contains("No se pudo eliminar");
		assertThat(exception.getCause()).isInstanceOf(IOException.class);
	}
}
