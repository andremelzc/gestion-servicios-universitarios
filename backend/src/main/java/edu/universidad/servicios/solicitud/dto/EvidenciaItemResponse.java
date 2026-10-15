package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.solicitud.domain.EvidenciaArchivo;

public record EvidenciaItemResponse(
        Long id,
        String tipo,
        String nombre,
        String mimeType,
        Long tamanoBytes
) {
    public static EvidenciaItemResponse de(EvidenciaArchivo e) {
        return new EvidenciaItemResponse(
                e.getId(),
                e.getTipoEvidencia() != null ? e.getTipoEvidencia().name() : null,
                e.getNombreOriginal(),
                e.getMimeType(),
                e.getTamanoBytes()
        );
    }
}
