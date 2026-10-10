package edu.universidad.servicios.solicitud.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

class FileTypeValidatorTest {

	private final FileTypeValidator validator = new FileTypeValidator();

	@Test
	void acceptsJpegWithMatchingSignatureExtensionAndContentType() {
		var file = new MockMultipartFile(
			"archivos",
			"evidencia.jpg",
			"image/jpeg",
			new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00 }
		);

		var result = validator.validate(file);

		assertThat(result.mimeType()).isEqualTo("image/jpeg");
		assertThat(result.originalName()).isEqualTo("evidencia.jpg");
	}

	@Test
	void rejectsExecutableRenamedAsJpeg() {
		var file = new MockMultipartFile(
			"archivos",
			"malware.jpg",
			"image/jpeg",
			"MZ executable".getBytes()
		);

		assertThrows(IllegalArgumentException.class, () ->
			validator.validate(file)
		);
	}

	@Test
	void rejectsUnsupportedExtension() {
		var file = new MockMultipartFile(
			"archivos",
			"archivo.exe",
			"application/octet-stream",
			"MZ executable".getBytes()
		);

		assertThrows(ResponseStatusException.class, () ->
			validator.validate(file)
		);
	}

	@Test
	void rejectsFileLargerThanFiveMegabytes() {
		var file = new MockMultipartFile(
			"archivos",
			"large.pdf",
			"application/pdf",
			new byte[(int) FileTypeValidator.MAX_FILE_SIZE_BYTES + 1]
		);

		var exception = assertThrows(ResponseStatusException.class, () ->
			validator.validate(file)
		);
		assertThat(exception.getStatusCode().value()).isEqualTo(413);
	}

	@Test
	void rejectsNullAndEmptyFiles() {
		assertThrows(IllegalArgumentException.class, () ->
			validator.validate(null)
		);
		var empty = new MockMultipartFile(
			"archivos",
			"empty.jpg",
			"image/jpeg",
			new byte[0]
		);
		assertThrows(IllegalArgumentException.class, () ->
			validator.validate(empty)
		);
	}

	@Test
	void acceptsPngAndPdfAndSanitizesOriginalPath() {
		var png = new MockMultipartFile(
			"archivos",
			"C:\\\\upload\\\\foto.PNG",
			"image/png",
			new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }
		);
		var pdf = new MockMultipartFile(
			"archivos",
			"documento.pdf",
			"application/pdf",
			new byte[] { 0x25, 0x50, 0x44, 0x46 }
		);

		assertThat(validator.validate(png).originalName()).isEqualTo(
			"foto.PNG"
		);
		assertThat(validator.validate(pdf).mimeType()).isEqualTo(
			"application/pdf"
		);
	}

	@Test
	void rejectsFailureReadingFileContent() throws Exception {
		MultipartFile file = mock(MultipartFile.class);
		when(file.isEmpty()).thenReturn(false);
		when(file.getSize()).thenReturn(10L);
		when(file.getOriginalFilename()).thenReturn("foto.jpg");
		when(file.getBytes()).thenThrow(new IOException("read failure"));

		var exception = assertThrows(IllegalArgumentException.class, () ->
			validator.validate(file)
		);
		assertThat(exception.getMessage()).contains("No se pudo leer");
	}

	@Test
	void rejectsMissingDeclaredContentType() {
		var file = new MockMultipartFile(
			"archivos",
			"evidencia.pdf",
			null,
			new byte[] { 0x25, 0x50, 0x44, 0x46 }
		);

		assertThrows(ResponseStatusException.class, () ->
			validator.validate(file)
		);
	}

	@Test
	void rejectsMissingFilenameAndFilenameWithoutExtension() {
		MultipartFile missingName = mock(MultipartFile.class);
		when(missingName.isEmpty()).thenReturn(false);
		when(missingName.getSize()).thenReturn(10L);
		when(missingName.getOriginalFilename()).thenReturn(null);
		assertThrows(ResponseStatusException.class, () ->
			validator.validate(missingName)
		);

		var noExtension = new MockMultipartFile(
			"archivos",
			"evidence",
			"image/jpeg",
			new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF }
		);
		assertThrows(ResponseStatusException.class, () ->
			validator.validate(noExtension)
		);
	}

	@Test
	void rejectsSignatureThatBelongsToAnotherAllowedExtension() {
		var file = new MockMultipartFile(
			"archivos",
			"imagen.jpg",
			"image/jpeg",
			new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }
		);

		assertThrows(IllegalArgumentException.class, () ->
			validator.validate(file)
		);
	}

	@Test
	void rejectsMismatchedDeclaredContentType() {
		var file = new MockMultipartFile(
			"archivos",
			"evidencia.pdf",
			"image/png",
			new byte[] { 0x25, 0x50, 0x44, 0x46 }
		);

		assertThrows(ResponseStatusException.class, () ->
			validator.validate(file)
		);
	}
}
