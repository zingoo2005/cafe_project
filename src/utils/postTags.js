export const FACTORS_BY_PURPOSE = {
  Study: [
    "Fast Wi-Fi",
    "Power Outlets",
    "Comfortable Seating",
    "Quiet Environment",
    "Large Study Tables",
  ],
  Relax: [
    "Peaceful Atmosphere",
    "Good Music",
    "Cozy Ambience",
    "Comfortable Seating",
    "Nice Interior",
  ],
  Meeting: [
    "Large Tables",
    "Group Seating",
    "Friendly Staff",
    "Spacious Environment",
    "Easy Conversation",
  ],
  Dating: [
    "Romantic Atmosphere",
    "Beautiful Interior",
    "Cozy Seating",
    "Good Music",
    "Nice Lighting",
  ],
  Work: [
    "Fast Wi-Fi",
    "Power Outlets",
    "Quiet Environment",
    "Comfortable Seating",
    "Work-Friendly Tables",
  ],
  Event: [
    "Spacious Environment",
    "Group Seating",
    "Beautiful Interior",
    "Friendly Staff",
    "Photo-Friendly Space",
  ],
};

export function getPostTagGroups(purposes = [], factors = []) {
  if (purposes.length === 0) {
    return factors.length > 0 ? [{ purpose: "Selected Factors", factors }] : [];
  }

  const remainingFactors = new Set(factors);
  const groups = purposes.map((purpose) => {
    const purposeFactors = (FACTORS_BY_PURPOSE[purpose] || []).filter((factor) => {
      if (!remainingFactors.has(factor)) return false;
      remainingFactors.delete(factor);
      return true;
    });

    return { purpose, factors: purposeFactors };
  });

  const customFactors = [...remainingFactors];
  if (customFactors.length > 0) {
    groups.push({ purpose: "Custom Factor", factors: customFactors });
  }

  return groups;
}

export function getPostPreviewTags(purposes = [], factors = [], maxFactors = 3) {
  const visibleFactors = factors.slice(0, maxFactors);

  return {
    purposes,
    factors: visibleFactors,
    remainingFactors: Math.max(0, factors.length - visibleFactors.length),
  };
}
