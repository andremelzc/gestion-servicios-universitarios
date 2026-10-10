package edu.universidad.servicios.solicitud.service;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Component
public class FileTypeValidator {

	public static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

	private static final Map<String, DetectedType> ALLOWED_TYPES = Map.of(
		"jpg",
		new DetectedType("image/jpeg", new byte[] {
			(byte) 0xFF,
			(byte) 0xD8,
			(byte) 0xFF,
		}),
		"jpeg",
		new DetectedType("image/jpeg", new byte[] {
			(byte) 0xFF,
			(byte) 0xD8,
			(byte) 0xFF,
		}),
		"png",
		new DetectedType("image/png", new byte[] {
			(byte) 0x89,
			0x50,
			0x4E,
			0x47,
			0x0D,
			0x0A,
			0x1A,
			0x0A,
		}),
		"pdf",
		new DetectedType("application/pdf", new byte[] {
			0x25,
			0x50,
			0x44,
			0x46,
		})
	);

	public ValidatedFile validate(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("El archivo está vacío");
		}
		if (file.getSize() > MAX_FILE_SIZE_BYTES) {
			throw new ResponseStatusException(
				HttpStatus.CONTENT_TOO_LARGE,
				"El archivo supera el límite de 5 MB"
			);
		}

		String originalName = file.getOriginalFilename();
		String extension = extensionOf(originalName);
		DetectedType expected = ALLOWED_TYPES.get(extension);
		if (expected == null) {
			throw unsupportedType();
		}

		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (IOException exception) {
			throw new IllegalArgumentException(
				"No se pudo leer el archivo",
				exception
			);
		}
		DetectedType detected = detect(bytes);
		if (
			detected == null || !detected.mimeType().equals(expected.mimeType())
		) {
			throw new IllegalArgumentException(
				"La firma del archivo no coincide con su extensión"
			);
		}

		String declaredType = file.getContentType();
		if (
			declaredType == null ||
			!expected.mimeType().equalsIgnoreCase(declaredType)
		) {
			throw unsupportedType();
		}

		return new ValidatedFile(
			sanitizeOriginalName(originalName),
			expected.mimeType(),
			bytes.length,
			bytes
		);
	}

	private String extensionOf(String name) {
		if (name == null) return "";
		String safeName = name.replace('\\', '/');
		int separator = safeName.lastIndexOf('/');
		String basename = safeName.substring(separator + 1);
		int dot = basename.lastIndexOf('.');
		return dot < 0
			? ""
			: basename.substring(dot + 1).toLowerCase(Locale.ROOT);
	}

	private String sanitizeOriginalName(String name) {
		String basename = name.replace('\\', '/');
		basename = basename.substring(basename.lastIndexOf('/') + 1).trim();
		return basename.substring(0, Math.min(basename.length(), 255));
	}

	private DetectedType detect(byte[] bytes) {
		return ALLOWED_TYPES.values()
			.stream()
			.distinct()
			.filter(type -> startsWith(bytes, type.signature()))
			.findFirst()
			.orElse(null);
	}

	private boolean startsWith(byte[] bytes, byte[] signature) {
		if (bytes.length < signature.length) return false;
		for (int i = 0; i < signature.length; i++) {
			if (bytes[i] != signature[i]) return false;
		}
		return true;
	}

	private ResponseStatusException unsupportedType() {
		return new ResponseStatusException(
			HttpStatus.UNSUPPORTED_MEDIA_TYPE,
			"Solo se permiten archivos JPG, PNG o PDF con tipo de contenido válido"
		);
	}

	private record DetectedType(String mimeType, byte[] signature) {}

	public record ValidatedFile(
		String originalName,
		String mimeType,
		long size,
		byte[] content
	) {}
}
