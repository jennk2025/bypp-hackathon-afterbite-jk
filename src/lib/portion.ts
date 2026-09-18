export function extractPortionUnit(servingSizeLabel: string): string {
  const match = servingSizeLabel.match(/1\s*([가-힣]+)/);
  return match ? match[1] : '개';
}

export function buildPortionPresets(servingSizeLabel: string): { label: string; multiplier: number }[] {
  const unit = extractPortionUnit(servingSizeLabel);
  return [
    { label: `반 ${unit}`, multiplier: 0.5 },
    { label: `한 ${unit}`, multiplier: 1 },
    { label: `두 ${unit}`, multiplier: 2 },
  ];
}
