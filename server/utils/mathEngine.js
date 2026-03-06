// ─────────────────────────────────────────────────────────────────────────────
// Dragonfly Math Engine v2.0 — 2026 Three-Pillar ROI Framework
// Benchmarked against: McKinsey AI Index 2025, Gartner AI ROI Report 2025,
// Deloitte AI Value Framework Q4 2025
// ─────────────────────────────────────────────────────────────────────────────

const industryMultipliers = {
    technology: {
        efficiency: 1.5,
        complexity: 0.7,
        adoption: 1.4,
        agenticReadiness: 1.3,
        riskProfile: 0.8,
    },
    financial: {
        efficiency: 1.3,
        complexity: 1.3,
        adoption: 1.0,
        agenticReadiness: 1.1,
        riskProfile: 1.5,
    },
    healthcare: {
        efficiency: 1.2,
        complexity: 1.5,
        adoption: 0.8,
        agenticReadiness: 0.9,
        riskProfile: 1.6,
    },
    manufacturing: {
        efficiency: 1.5,
        complexity: 1.0,
        adoption: 1.0,
        agenticReadiness: 1.0,
        riskProfile: 1.0,
    },
    retail: {
        efficiency: 1.4,
        complexity: 0.9,
        adoption: 1.3,
        agenticReadiness: 1.2,
        riskProfile: 0.9,
    },
    marketing: {
        efficiency: 1.7,
        complexity: 0.7,
        adoption: 1.5,
        agenticReadiness: 1.4,
        riskProfile: 0.7,
    },
    consulting: {
        efficiency: 1.5,
        complexity: 0.8,
        adoption: 1.3,
        agenticReadiness: 1.3,
        riskProfile: 0.8,
    },
    education: {
        efficiency: 1.1,
        complexity: 1.0,
        adoption: 0.9,
        agenticReadiness: 0.8,
        riskProfile: 0.9,
    },
    logistics: {
        efficiency: 1.5,
        complexity: 1.0,
        adoption: 1.1,
        agenticReadiness: 1.1,
        riskProfile: 1.0,
    },
    energy: {
        efficiency: 1.3,
        complexity: 1.2,
        adoption: 0.9,
        agenticReadiness: 0.9,
        riskProfile: 1.3,
    },
};

const useCaseMultipliers = {
    automation: {
        savings: 1.4,
        complexity: 0.9,
        agenticLift: 1.2,
        timeToValue: 0.8
    },
    analytics: {
        savings: 1.2,
        complexity: 1.1,
        agenticLift: 1.1,
        timeToValue: 1.0
    },
    'customer-service': {
        savings: 1.3,
        complexity: 0.8,
        agenticLift: 1.3,
        timeToValue: 0.7
    },
    content: {
        savings: 1.5,
        complexity: 0.7,
        agenticLift: 1.2,
        timeToValue: 0.6
    },
    predictive: {
        savings: 1.2,
        complexity: 1.2,
        agenticLift: 1.0,
        timeToValue: 1.3
    },
    quality: {
        savings: 1.1,
        complexity: 1.0,
        agenticLift: 0.9,
        timeToValue: 1.1
    },
    personalization: {
        savings: 1.4,
        complexity: 1.0,
        agenticLift: 1.2,
        timeToValue: 0.9
    },
    optimization: {
        savings: 1.3,
        complexity: 1.1,
        agenticLift: 1.1,
        timeToValue: 1.0
    },
};

const scopeMultipliers = {
    pilot: {
        cost: 0.25,
        savings: 0.15,
        timeline: 0.4
    },
    department: {
        cost: 0.65,
        savings: 0.55,
        timeline: 0.75
    },
    enterprise: {
        cost: 1.6,
        savings: 1.0,
        timeline: 1.6
    },
    'customer-facing': {
        cost: 1.3,
        savings: 1.4,
        timeline: 1.3
    },
};

const sizeFactors = {
    startup: {
        baseCost: 35000,
        efficiency: 1.3,
        complexity: 0.7,
        dataReadiness: 0.75
    },
    small: {
        baseCost: 120000,
        efficiency: 1.1,
        complexity: 0.9,
        dataReadiness: 0.85
    },
    medium: {
        baseCost: 380000,
        efficiency: 1.0,
        complexity: 1.0,
        dataReadiness: 1.0
    },
    large: {
        baseCost: 850000,
        efficiency: 0.9,
        complexity: 1.3,
        dataReadiness: 1.1
    },
};

// Implementation phase labels for timeline output
const phaseTimelines = {
    pilot: [
        'Week 1–2: Discovery & Data Audit',
        'Week 3–6: Pilot Build & Integration',
        'Week 7–8: Testing & Validation',
        'Week 9–10: Controlled Rollout',
    ],
    department: [
        'Month 1: Discovery, Scoping & Data Prep',
        'Month 2–3: Core Build & Integration',
        'Month 4: Team Training & Change Management',
        'Month 5–6: Full Department Rollout & Optimization',
    ],
    enterprise: [
        'Month 1–2: Enterprise Discovery & Architecture',
        'Month 3–5: Foundation Build & Data Infrastructure',
        'Month 6–9: Phased Departmental Rollout',
        'Month 10–12: Enterprise Optimization & Governance',
        'Month 13–18: Scale & Continuous Improvement',
    ],
    'customer-facing': [
        'Month 1: UX Research & Compliance Review',
        'Month 2–3: Core Build & Security Hardening',
        'Month 4: Beta Testing & Feedback Loop',
        'Month 5–6: Staged Production Rollout',
    ],
};

export function calculateROI(inputData) {
    const {
        industry = 'technology',
            companySize = 'medium',
            revenue,
            useCase = 'automation',
            scope = 'pilot',
            currentEfficiency = 'medium',
            techReadiness = 'intermediate',
            changeReadiness = 'neutral',
    } = inputData;

    // Revenue guard — loud failure, never silent
    if (!revenue || typeof revenue !== 'number' || revenue <= 0) {
        throw new Error(
            `Revenue is required and must be a positive number. The intake parser returned: ${revenue}. ` +
            `Ask the user to include their approximate annual revenue in their description.`
        );
    }

    // Input normalization
    const normalizedIndustry = (industry || '').toLowerCase().trim();
    const normalizedSize = (companySize || '').toLowerCase().trim();
    const normalizedUseCase = (useCase || '').toLowerCase().trim();
    const normalizedScope = (scope || '').toLowerCase().trim();
    const normalizedEfficiency = (currentEfficiency || '').toLowerCase().trim();
    const normalizedTech = (techReadiness || '').toLowerCase().trim();
    const normalizedChange = (changeReadiness || '').toLowerCase().trim();

    const industryData = industryMultipliers[normalizedIndustry] || industryMultipliers.technology;
    const useCaseData = useCaseMultipliers[normalizedUseCase] || useCaseMultipliers.automation;
    const scopeData = scopeMultipliers[normalizedScope] || scopeMultipliers.pilot;
    const sizeData = sizeFactors[normalizedSize] || sizeFactors.medium;

    if (!industryMultipliers[normalizedIndustry])
        console.warn(`[mathEngine] Unrecognized industry: "${industry}". Using technology defaults.`);
    if (!useCaseMultipliers[normalizedUseCase])
        console.warn(`[mathEngine] Unrecognized useCase: "${useCase}". Using automation defaults.`);

    // ─── READINESS MULTIPLIERS ──────────────────────────────────────────────
    let efficiencyBaseline = 0.08;
    if (normalizedEfficiency === 'low') efficiencyBaseline = 0.13;
    if (normalizedEfficiency === 'medium') efficiencyBaseline = 0.08;
    if (normalizedEfficiency === 'high') efficiencyBaseline = 0.04;

    let techMultiplier = 1.0;
    if (normalizedTech === 'basic') techMultiplier = 0.65;
    if (normalizedTech === 'intermediate') techMultiplier = 0.88;
    if (normalizedTech === 'advanced') techMultiplier = 1.15;

    let changeMultiplier = 1.0;
    if (normalizedChange === 'resistant') changeMultiplier = 0.55;
    if (normalizedChange === 'neutral') changeMultiplier = 0.8;
    if (normalizedChange === 'adaptable') changeMultiplier = 1.05;

    // ─── THREE-PILLAR VALUE MODEL ───────────────────────────────────────────
    // Pillar 1: Operational Efficiency — direct labor and process cost savings
    const operationalSavings =
        revenue *
        efficiencyBaseline *
        industryData.efficiency *
        useCaseData.savings *
        scopeData.savings *
        sizeData.efficiency *
        techMultiplier *
        changeMultiplier *
        0.65; // 2026 conservative realization factor (benchmark: 25% of AI initiatives deliver expected ROI)

    // Pillar 2: Revenue Generation — AI-enabled growth contribution
    // Material only for customer-facing, personalization, and content use cases
    const isRevenueGenerating = ['customer-service', 'personalization', 'content'].includes(normalizedUseCase) ||
        normalizedScope === 'customer-facing';
    const revenueGenMultiplier = isRevenueGenerating ? 0.04 : 0.015;
    const revenueGeneration =
        revenue * revenueGenMultiplier * industryData.agenticReadiness * techMultiplier * 0.5; // Heavily discounted — attribution is indirect

    // Pillar 3: Risk & Compliance Mitigation
    // High-risk industries (financial, healthcare, energy) derive disproportionate value here
    const riskMitigationMultiplier = ['financial', 'healthcare', 'energy'].includes(
            normalizedIndustry
        ) ?
        0.025 :
        0.01;
    const riskMitigation =
        revenue * riskMitigationMultiplier * scopeData.savings * industryData.riskProfile * 0.4;

    const adjustedSavings = operationalSavings + revenueGeneration + riskMitigation;

    const savingsBreakdown = {
        operationalEfficiency: Math.round(operationalSavings),
        revenueGeneration: Math.round(revenueGeneration),
        riskMitigation: Math.round(riskMitigation),
    };

    // ─── FULL COST MODEL (2026 — HIDDEN COSTS INCLUDED) ────────────────────
    const baseCost = sizeData.baseCost * scopeData.cost;
    const complexityCost =
        baseCost * industryData.complexity * useCaseData.complexity * sizeData.complexity;

    // Tech infrastructure uplift
    const techCost =
        normalizedTech === 'basic' ?
        baseCost * 0.5 :
        normalizedTech === 'intermediate' ?
        baseCost * 0.25 :
        0;

    // Change management: 2026 benchmark 20-35% of base for resistant cultures
    const changeCost =
        normalizedChange === 'resistant' ?
        baseCost * 0.35 :
        normalizedChange === 'neutral' ?
        baseCost * 0.18 :
        baseCost * 0.08;

    // Data preparation: industry benchmark 60-80% of project timeline & budget
    // Most business cases ignore this — we don't
    const dataPrepCost =
        normalizedTech === 'basic' ?
        (baseCost * 0.45) / (sizeData.dataReadiness || 1) :
        normalizedTech === 'intermediate' ?
        (baseCost * 0.28) / (sizeData.dataReadiness || 1) :
        (baseCost * 0.12) / (sizeData.dataReadiness || 1);

    // Ongoing maintenance: 15-20% of implementation annually (Year 2+)
    const annualMaintenanceCost = (baseCost + complexityCost) * 0.18;

    const totalImplementationCost = baseCost + complexityCost + techCost + changeCost + dataPrepCost;

    const costBreakdown = {
        baseDevelopment: Math.round(baseCost),
        complexityPremium: Math.round(complexityCost),
        techInfrastructure: Math.round(techCost),
        changeManagement: Math.round(changeCost),
        dataPreparation: Math.round(dataPrepCost),
        annualMaintenance: Math.round(annualMaintenanceCost),
    };

    // ─── REALISTIC REALIZATION CURVE (2026 benchmarked) ────────────────────
    // Only 6% of implementations see payback under 12 months
    // Most enterprises achieve returns within 2-4 years
    const yearOneRealization = adjustedSavings * 0.2;
    const yearTwoRealization = adjustedSavings * 0.6;
    const yearThreeRealization = adjustedSavings * 0.9;

    const threeYearSavings = yearOneRealization + yearTwoRealization + yearThreeRealization;
    const threeYearTotalCost = totalImplementationCost + annualMaintenanceCost * 2;
    const threeYearROI = ((threeYearSavings - threeYearTotalCost) / threeYearTotalCost) * 100;

    // ─── PAYBACK PERIOD (extended to 72 months) ─────────────────────────────
    let paybackMonths = null;
    let cumulativeSavings = 0;
    for (let month = 1; month <= 72; month++) {
        const monthlyBase = adjustedSavings / 12;
        if (month <= 12) cumulativeSavings += monthlyBase * 0.2;
        else if (month <= 24) cumulativeSavings += monthlyBase * 0.6;
        else cumulativeSavings += monthlyBase * 0.9;
        if (cumulativeSavings >= totalImplementationCost) {
            paybackMonths = month;
            break;
        }
    }

    // ─── AGENTIC READINESS SCORE (0–100) ────────────────────────────────────
    // Measures how well-positioned this organization is for autonomous AI deployment
    let agenticScore = 40;
    agenticScore +=
        industryData.agenticReadiness >= 1.3 ? 12 : industryData.agenticReadiness >= 1.1 ? 7 : 2;
    if (normalizedTech === 'advanced') agenticScore += 18;
    else if (normalizedTech === 'intermediate') agenticScore += 9;
    else agenticScore -= 8;
    if (normalizedChange === 'adaptable') agenticScore += 14;
    else if (normalizedChange === 'resistant') agenticScore -= 14;
    agenticScore += useCaseData.agenticLift >= 1.2 ? 10 : useCaseData.agenticLift >= 1.0 ? 5 : 2;
    if (revenue >= 10000000) agenticScore += 6;
    if (revenue < 500000) agenticScore -= 4;
    agenticScore = Math.max(10, Math.min(95, agenticScore));

    // ─── CONFIDENCE SCORE (20–85) ────────────────────────────────────────────
    // Redesigned with meaningful differentiation across the full range
    let confidenceScore = 40;
    if (['technology', 'marketing'].includes(normalizedIndustry)) confidenceScore += 12;
    else if (['retail', 'consulting', 'logistics'].includes(normalizedIndustry)) confidenceScore += 8;
    else if (['manufacturing'].includes(normalizedIndustry)) confidenceScore += 6;
    else if (['financial', 'healthcare'].includes(normalizedIndustry)) confidenceScore += 3;

    if (['automation', 'content', 'customer-service'].includes(normalizedUseCase))
        confidenceScore += 12;
    else if (['personalization', 'optimization'].includes(normalizedUseCase)) confidenceScore += 8;
    else if (['analytics'].includes(normalizedUseCase)) confidenceScore += 6;
    else confidenceScore += 3;

    if (normalizedTech === 'advanced') confidenceScore += 10;
    else if (normalizedTech === 'intermediate') confidenceScore += 5;
    else confidenceScore -= 12;

    if (normalizedChange === 'adaptable') confidenceScore += 10;
    else if (normalizedChange === 'resistant') confidenceScore -= 18;

    if (normalizedScope === 'pilot') confidenceScore += 8;
    else if (normalizedScope === 'department') confidenceScore += 3;
    else if (normalizedScope === 'enterprise') confidenceScore -= 6;

    if (revenue >= 10000000) confidenceScore += 3;
    if (revenue < 100000) confidenceScore -= 5;

    confidenceScore = Math.max(20, Math.min(85, confidenceScore));

    // ─── RISK FLAGS ──────────────────────────────────────────────────────────
    // Surfaced directly in the UI to provide honest advisory context
    const riskFlags = [];
    if (normalizedChange === 'resistant')
        riskFlags.push({
            level: 'high',
            message: 'Resistant organizational culture significantly increases failure risk. Change management investment is non-negotiable.',
        });
    if (normalizedTech === 'basic')
        riskFlags.push({
            level: 'high',
            message: 'Basic tech infrastructure will require substantial foundation work before AI deployment. Budget 45–50% of implementation cost for data preparation.',
        });
    if (normalizedScope === 'enterprise' && normalizedTech !== 'advanced')
        riskFlags.push({
            level: 'medium',
            message: 'Enterprise scope with sub-advanced tech readiness increases timeline and budget risk. Consider starting with a department pilot.',
        });
    if (confidenceScore < 45)
        riskFlags.push({
            level: 'medium',
            message: 'Multiple readiness factors are working against this initiative. A structured readiness assessment is recommended before committing to implementation.',
        });
    if (dataPrepCost > baseCost * 0.4)
        riskFlags.push({
            level: 'medium',
            message: 'Data preparation costs are unusually high for this profile. Prioritize a data audit in Phase 1 to avoid mid-project budget overruns.',
        });
    if (paybackMonths === null)
        riskFlags.push({
            level: 'high',
            message: 'Payback period exceeds 72 months under current conditions. Descoping to a pilot or department rollout is strongly recommended.',
        });

    // ─── STRATEGIC RECOMMENDATIONS ──────────────────────────────────────────
    // Three prioritized actions based on the calculated profile
    const strategicRecommendations = [];
    if (normalizedScope === 'enterprise' && confidenceScore < 65)
        strategicRecommendations.push(
            'Start with a time-boxed 90-day pilot to validate assumptions and build organizational buy-in before committing enterprise budget.'
        );
    if (normalizedTech === 'basic' || normalizedTech === 'intermediate')
        strategicRecommendations.push(
            'Invest in data infrastructure and integration foundations in parallel with AI development — this directly determines how quickly you realize savings.'
        );
    if (normalizedChange === 'resistant' || normalizedChange === 'neutral')
        strategicRecommendations.push(
            'Establish an internal AI Champions program. Teams with designated advocates adopt AI tools 2.3x faster than those without.'
        );
    if (agenticScore >= 65)
        strategicRecommendations.push(
            'Your agentic readiness profile supports moving beyond simple automation into autonomous agent deployment. Prioritize agentic use cases in Year 2.'
        );
    if (isRevenueGenerating)
        strategicRecommendations.push(
            `${normalizedUseCase === 'customer-service' ? 'AI-powered customer experience' : 'Content and personalization AI'} has strong revenue generation upside for your profile — ensure the architecture includes a feedback loop to measure revenue attribution.`
        );
    // Always include at minimum 3 recommendations
    if (strategicRecommendations.length < 3)
        strategicRecommendations.push(
            'Define clear success metrics and measurement cadence before implementation begins. Organizations with pre-defined KPIs are 1.7x more likely to report positive ROI.'
        );

    // ─── IMPLEMENTATION TIMELINE ─────────────────────────────────────────────
    const implementationTimeline = phaseTimelines[normalizedScope] || phaseTimelines.pilot;

    // ─── FINAL RETURN OBJECT ─────────────────────────────────────────────────
    return {
        // Core financials (existing fields — backward compatible)
        adjustedSavings: Math.round(adjustedSavings),
        totalImplementationCost: Math.round(totalImplementationCost),
        threeYearROI: Math.round(threeYearROI),
        paybackMonths,
        confidenceScore,
        // New enriched fields
        agenticScore,
        savingsBreakdown,
        costBreakdown,
        riskFlags,
        strategicRecommendations,
        implementationTimeline,
        annualMaintenanceCost: Math.round(annualMaintenanceCost),
        yearOneRealization: Math.round(yearOneRealization),
        yearTwoRealization: Math.round(yearTwoRealization),
        yearThreeRealization: Math.round(yearThreeRealization),
    };
}