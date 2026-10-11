/**
 * Utility for handling member photo profile and KTP images:
 * - Compress image files to compact base64 data URLs for localStorage
 * - Generate simulated high-res Indonesian e-KTP card canvas for preview/testing
 * - Avatar color generators
 */

export function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memproses gambar.'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate high-fidelity simulated e-KTP graphic on an HTML canvas
 * for instant visual verification in the DPW NasDem admin portal.
 */
export function generateSimulatedKtp(
  nik: string,
  nama: string,
  kabKota: string,
  kecamatan: string,
  kelurahan: string
): string {
  const width = 850;
  const height = 540;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient: Authentic Indonesian e-KTP blue-cyan gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#59b0d8');
  bgGrad.addColorStop(0.5, '#7bc9e8');
  bgGrad.addColorStop(1, '#9cd7ee');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Guilloche pattern simulation
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  for (let i = -width; i < width * 2; i += 35) {
    ctx.beginPath();
    ctx.arc(i, height / 2, 280, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px Poppins, sans-serif';
  ctx.fillText('REPUBLIK INDONESIA', width / 2, 38);
  ctx.font = 'bold 18px Poppins, sans-serif';
  ctx.fillText('PROVINSI SULAWESI UTARA', width / 2, 64);
  ctx.font = '16px Poppins, sans-serif';
  ctx.fillText(kabKota.toUpperCase(), width / 2, 88);

  // Line separator
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 98);
  ctx.lineTo(width - 40, 98);
  ctx.stroke();

  // NIK
  ctx.textAlign = 'left';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('NIK', 45, 138);
  ctx.fillText(`:  ${nik || '7100000000000000'}`, 180, 138);

  // Fields
  const fields = [
    { label: 'Nama', value: (nama || 'KADER PARTAI NASDEM').toUpperCase() },
    { label: 'Tempat/Tgl Lahir', value: `${kabKota.replace('Kota ', '').replace('Kabupaten ', '')}, 15-08-1985` },
    { label: 'Jenis Kelamin', value: 'LAKI-LAKI' },
    { label: 'Alamat', value: `JL. RAYA UTAMA NO. 45` },
    { label: '    RT/RW', value: '003 / 002' },
    { label: '    Kel/Desa', value: (kelurahan || 'PAAL DUA').toUpperCase() },
    { label: '    Kecamatan', value: (kecamatan || 'WENANG').toUpperCase() },
    { label: 'Agama', value: 'INDONESIA' },
    { label: 'Status Perkawinan', value: 'KAWIN' },
    { label: 'Pekerjaan', value: 'WIRASWASTA' },
    { label: 'Kewarganegaraan', value: 'WNI' },
    { label: 'Berlaku Hingga', value: 'SEUMUR HIDUP' },
  ];

  let startY = 170;
  const lineHeight = 26;
  ctx.font = 'bold 14px Poppins, sans-serif';

  fields.forEach((f) => {
    ctx.font = '13px Poppins, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(f.label, 45, startY);

    ctx.font = 'bold 13px Poppins, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`: ${f.value}`, 220, startY);
    startY += lineHeight;
  });

  // Simulated Photo Box on the right
  const photoX = width - 230;
  const photoY = 120;
  const photoW = 180;
  const photoH = 240;

  // Blue photo background
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // Person Silhouette inside photo
  ctx.fillStyle = '#f8fafc';
  // Head
  ctx.beginPath();
  ctx.arc(photoX + photoW / 2, photoY + 70, 36, 0, Math.PI * 2);
  ctx.fill();
  // Body/Shoulders
  ctx.beginPath();
  ctx.arc(photoX + photoW / 2, photoY + 210, 75, Math.PI, Math.PI * 2);
  ctx.fill();

  // Signature box simulation
  const sigX = photoX + 10;
  const sigY = photoY + photoH + 20;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(sigX, sigY, 160, 60);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(sigX, sigY, 160, 60);

  // Simulated signature squiggles
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sigX + 20, sigY + 35);
  ctx.bezierCurveTo(sigX + 50, sigY + 10, sigX + 80, sigY + 50, sigX + 110, sigY + 25);
  ctx.bezierCurveTo(sigX + 120, sigY + 45, sigX + 140, sigY + 15, sigX + 150, sigY + 38);
  ctx.stroke();

  // Security Watermark Overlay
  ctx.save();
  ctx.translate(width / 2, height / 2 + 30);
  ctx.rotate(-Math.PI / 8);
  ctx.font = 'bold 32px Poppins, sans-serif';
  ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
  ctx.textAlign = 'center';
  ctx.fillText('ARSIP RESMI DPW PARTAI NASDEM SULUT', 0, 0);
  ctx.fillText('TERVERIFIKASI FAKTUAL', 0, 40);
  ctx.restore();

  // Corner Chip simulation
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(photoX - 70, 420, 50, 40);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX - 70, 420, 50, 40);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(photoX - 60, 432, 30, 16);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Generate quick initials for members without uploaded photo
 */
export function getInitials(name: string): string {
  if (!name) return 'ND';
  const parts = name.replace(/^(Dr\.|Ir\.|H\.|Hj\.|Prof\.|Drs\.|SH|MH|M\.Si|SE|MM|A\.Md|ST|S\.Kom)/gi, '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Consistent gradient background for avatar based on name
 */
export function getAvatarColor(name: string): { bgClass: string; textClass: string } {
  const colors = [
    { bgClass: 'bg-gradient-to-br from-blue-700 to-indigo-900', textClass: 'text-amber-300' },
    { bgClass: 'bg-gradient-to-br from-amber-600 to-amber-900', textClass: 'text-white' },
    { bgClass: 'bg-gradient-to-br from-sky-600 to-blue-800', textClass: 'text-amber-200' },
    { bgClass: 'bg-gradient-to-br from-slate-700 to-slate-900', textClass: 'text-amber-400' },
    { bgClass: 'bg-gradient-to-br from-indigo-700 to-blue-900', textClass: 'text-white' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
