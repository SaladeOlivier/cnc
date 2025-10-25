# CNC Data Structure v2.0

## Overview

The scraper now generates **normalized, relational data** using unique IDs for cross-referencing. This eliminates duplication and enables better analysis.

## Data Model

### 1. Commissions
```json
{
  "id": "com_1",
  "url": "https://www.cnc.fr/...",
  "date": "2025-07-03",
  "aidName": "Fonds d'aide aux créateurs vidéo sur Internet (CNC Talent)",
  "presidentId": "tal_45",
  "memberIds": ["tal_46", "tal_47", "tal_48", ...],
  "projectIds": ["pro_1", "pro_2", "pro_3", ...]
}
```
**Note**: President and members are now stored as talent IDs instead of names, enabling deduplication and tracking of commission members across multiple commissions.

### 2. Projects
```json
{
  "id": "pro_1",
  "name": "A MUSEE VOUS, A MUSEE MOI",
  "description": "Série – Documentaire - Arts / Histoire de l'Art",
  "beneficiaryId": "ben_1",
  "talentId": "tal_1",
  "amount": 30000,
  "category": "À LA CRÉATION",
  "commissionId": "com_1"
}
```

### 3. Beneficiaries
```json
{
  "id": "ben_1",
  "slug": "dada-media",  // For deduplication
  "name": "DADA MEDIA",
  "projectIds": ["pro_1", "pro_5"],
  "commissionIds": ["com_1", "com_3"]
}
```

### 4. Talents
```json
{
  "id": "tal_1",
  "slug": "fouzia-kechkech",  // For deduplication
  "name": "Fouzia KECHKECH",
  "projectIds": ["pro_1", "pro_5"],
  "commissionIds": ["com_1", "com_3"]  // Commissions where this person is a member/president
}
```
**Note**: Talents can be either project creators/channels OR commission members/presidents. The `commissionIds` array tracks which commissions they participated in.

## Key Features

### 🔑 ID Prefixes
- `com_` - Commissions
- `pro_` - Projects
- `ben_` - Beneficiaries
- `tal_` - Talents (creators/channels)

### 🔄 Automatic Deduplication

**Slug-based matching**: Names are normalized to slugs for deduplication.

Example:
```
"DADA MEDIA"       → slug: "dada-media"
"Dada Media"       → slug: "dada-media"  (same beneficiary!)
"Dada Média"       → slug: "dada-media"  (accents removed)
```

This means:
- Same beneficiary appearing in multiple projects → Same `beneficiaryId`
- Same talent working on multiple projects → Same `talentId`
- No duplicate entries!

### 🔗 Cross-References

**From Commission → Projects:**
```javascript
const commission = data.commissions.find(c => c.id === 'com_1');
const projects = commission.projectIds.map(id =>
  data.projects.find(p => p.id === id)
);
```

**From Project → Beneficiary:**
```javascript
const project = data.projects.find(p => p.id === 'pro_1');
const beneficiary = data.beneficiaries.find(b => b.id === project.beneficiaryId);
```

**From Beneficiary → All Projects:**
```javascript
const beneficiary = data.beneficiaries.find(b => b.id === 'ben_1');
const allProjects = beneficiary.projectIds.map(id =>
  data.projects.find(p => p.id === id)
);
// How many times did this beneficiary get funded?
console.log(`${beneficiary.name}: ${allProjects.length} projects`);
```

**From Talent → All Projects:**
```javascript
const talent = data.talents.find(t => t.id === 'tal_1');
const allProjects = talent.projectIds.map(id =>
  data.projects.find(p => p.id === id)
);
// Total amount this talent received
const totalFunding = allProjects.reduce((sum, p) => sum + (p.amount || 0), 0);
```

## Queries You Can Now Do

### 1. Top Funded Beneficiaries
```javascript
const beneficiaryFunding = data.beneficiaries.map(b => ({
  name: b.name,
  totalProjects: b.projectIds.length,
  totalCommissions: b.commissionIds.length,
  totalFunding: b.projectIds.reduce((sum, projId) => {
    const project = data.projects.find(p => p.id === projId);
    return sum + (project?.amount || 0);
  }, 0)
})).sort((a, b) => b.totalFunding - a.totalFunding);
```

### 2. Most Prolific Talents
```javascript
const talentStats = data.talents.map(t => ({
  name: t.name,
  projectCount: t.projectIds.length,
  totalFunding: t.projectIds.reduce((sum, projId) => {
    const project = data.projects.find(p => p.id === projId);
    return sum + (project?.amount || 0);
  }, 0)
})).sort((a, b) => b.projectCount - a.projectCount);
```

### 3. Commission Activity
```javascript
const commissionStats = data.commissions.map(c => ({
  date: c.date,
  projectCount: c.projectIds.length,
  totalFunding: c.projectIds.reduce((sum, projId) => {
    const project = data.projects.find(p => p.id === projId);
    return sum + (project?.amount || 0);
  }, 0)
}));
```

### 4. Beneficiary appearing multiple times
```javascript
// Which beneficiaries got funding more than once?
const repeatBeneficiaries = data.beneficiaries
  .filter(b => b.projectIds.length > 1)
  .map(b => ({
    name: b.name,
    projects: b.projectIds.length,
    commissions: b.commissionIds.length
  }))
  .sort((a, b) => b.projects - a.projects);
```

## Migration from v1.0

**Old structure (v1.0):**
```json
{
  "projects": [{
    "name": "Project A",
    "beneficiary": "DADA MEDIA",  // String duplication
    "talent": "Fouzia KECHKECH"   // String duplication
  }]
}
```

**New structure (v2.0):**
```json
{
  "projects": [{
    "id": "pro_1",
    "name": "Project A",
    "beneficiaryId": "ben_1",  // Reference by ID
    "talentId": "tal_1"        // Reference by ID
  }],
  "beneficiaries": [{
    "id": "ben_1",
    "name": "DADA MEDIA",
    "slug": "dada-media"
  }],
  "talents": [{
    "id": "tal_1",
    "name": "Fouzia KECHKECH",
    "slug": "fouzia-kechkech"
  }]
}
```

## Benefits

✅ **No duplication**: Each entity stored once
✅ **Easy queries**: Track relationships across the dataset
✅ **Deduplication**: Automatic normalization of names
✅ **Scalable**: Works with any number of aids/commissions
✅ **Portable**: Standard JSON structure
✅ **Flexible**: Easy to add new entity types later

## Next Steps

The frontend (Svelte app) needs to be updated to work with this new structure. It should:
1. Load the normalized data
2. Create lookup Maps for fast access by ID
3. Provide helper functions for common queries
4. Display denormalized views for the user
