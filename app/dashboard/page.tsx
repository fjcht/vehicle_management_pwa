'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { ScanBarcode, Camera, XCircle } from 'lucide-react';
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';

// Definir las hints para ZXing
const hints = new Map();
const formats = [
  // Barcodes
  1, // AZTEC
  2, // CODABAR
  4, // CODE_39
  8, // CODE_93
  16, // CODE_128
  32, // DATA_MATRIX
  64, // EAN_8
  128, // EAN_13
  256, // ITF
  512, // MAXICODE
  1024, // PDF_417
  2048, // RSS_14
  4096, // RSS_EXPANDED
  8192, // UPC_A
  16384, // UPC_E
  32768, // UPC_EAN_EXTENSION
  // QR Codes
  65536, // QR_CODE
];
hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
hints.set(DecodeHintType.TRY_HARDER, true); // Intentar más para encontrar el código

// CAMBIO: Cambiado a exportación por defecto
export default function SmartVinInput({ value, onChange }: { value: string; onChange: (vin: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null); // Para mantener una referencia al stream

  // Función para obtener dispositivos de video
  const getCameraDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputDevices);
      if (videoInputDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error al enumerar dispositivos de cámara:", err);
      setCameraError("No se pudieron listar las cámaras.");
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    getCameraDevices();
  }, [getCameraDevices]);

  // Función para iniciar el escaneo
  const startScan = useCallback(async () => {
    if (!selectedDeviceId) {
      setCameraError("No se ha seleccionado ninguna cámara.");
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setCameraError(null);

    // Detener cualquier stream existente antes de iniciar uno nuevo
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (!codeReader.current) {
      codeReader.current = new BrowserMultiFormatReader(hints);
    }

    try {
      const videoElement = videoRef.current;
      if (!videoElement) {
        console.error("Elemento de video no disponible.");
        setCameraError("Error: Elemento de video no disponible.");
        setIsScanning(false);
        return;
      }

      // Iniciar el escaneo con la cámara seleccionada
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedDeviceId } });
      setStream(newStream); // Guardar referencia al stream
      videoElement.srcObject = newStream;
      await videoElement.play(); // Asegurarse de que el video se reproduzca

      console.log('Cámara iniciada, intentando decodificar...');
      codeReader.current.decodeFromStream(newStream, videoElement, (result, error) => {
        if (result) {
          console.log('VIN escaneado:', result.getText());
          setScanResult(result.getText());
          onChange(result.getText()); // Actualizar el valor del input
          stopScan(); // Detener el escaneo automáticamente al encontrar un resultado
        }
        if (error && !(error instanceof Error && error.message.includes('No MultiFormat Readers were able to satisfy the decode request'))) {
          // Ignorar errores de "no se encontró código" para evitar spam en la consola
          console.error('Error de escaneo:', error);
          // setCameraError(`Error de escaneo: ${error.message}`); // Descomentar para ver errores detallados
        }
      });
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      setCameraError(`Error al acceder a la cámara: ${err instanceof Error ? err.message : String(err)}`);
      setIsScanning(false);
    }
  }, [selectedDeviceId, onChange, stream]); // Añadir 'stream' a las dependencias

  // Función para detener el escaneo
  const stopScan = useCallback(() => {
    if (codeReader.current) {
      codeReader.current.reset();
      console.log('Escaneo detenido.');
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    setCameraError(null); // Limpiar errores al detener
  }, [stream]);

  // Efecto para detener el escaneo cuando el componente se desmonta o isScanning cambia a false
  useEffect(() => {
    return () => {
      if (isScanning) {
        stopScan();
      }
    };
  }, [isScanning, stopScan]);

  // Efecto para reiniciar el escaneo si cambia la cámara seleccionada mientras se está escaneando
  useEffect(() => {
    if (isScanning && selectedDeviceId) {
      stopScan(); // Detener el escaneo actual
      startScan(); // Iniciar con la nueva cámara
    }
  }, [selectedDeviceId, isScanning, startScan, stopScan]);


  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="vin-input">VIN</Label>
      <div className="flex space-x-2">
        <Input
          id="vin-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Introduce o escanea el VIN"
          className="flex-grow"
          disabled={isScanning}
        />
        <Button type="button" onClick={isScanning ? stopScan : startScan} disabled={!selectedDeviceId && !isScanning}>
          {isScanning ? <XCircle className="h-4 w-4 mr-2" /> : <ScanBarcode className="h-4 w-4 mr-2" />}
          {isScanning ? 'Detener Escaneo' : 'Escanear VIN'}
        </Button>
      </div>

      {isScanning && (
        <div className="relative w-full h-64 bg-gray-200 flex items-center justify-center rounded-md overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-1/4 border-2 border-red-500 opacity-75 animate-pulse"></div>
          </div>
          {cameraError && <p className="absolute text-red-500 bg-white p-2 rounded-md">{cameraError}</p>}
        </div>
      )}

      {videoDevices.length > 1 && isScanning && (
        <div className="flex items-center space-x-2">
          <Label htmlFor="camera-select">Seleccionar Cámara:</Label>
          <select
            id="camera-select"
            className="p-2 border rounded-md"
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            value={selectedDeviceId || ''}
          >
            {videoDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Cámara ${device.deviceId}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {scanResult && isScanning && (
        <p className="text-green-600 font-semibold">VIN Escaneado: {scanResult}</p>
      )}
    </div>
  );
}