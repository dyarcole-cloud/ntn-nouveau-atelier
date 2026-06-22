import type { ClinicalReference } from '../types/domain';

export const CLINICAL_DATA: ClinicalReference[] = [
  {
    slId: 'spravato',
    name: "Spravato (Esketamine Nasal Spray)",
    tier: "Tier 1", tierColor: "#E11D48",
    classification: "FDA-approved interventional psychiatric medication (REMS-restricted)",
    mechanism: "Esketamine is the S-enantiomer of racemic ketamine and a nonselective, noncompetitive NMDA glutamate receptor antagonist. Unlike traditional monoaminergic antidepressants targeting serotonin/norepinephrine over weeks, esketamine modulates the glutamatergic system. By preferentially blocking NMDA receptors on inhibitory GABAergic interneurons, it transiently enhances glutamatergic neuron activity, increasing presynaptic glutamate release. This triggers AMPA receptor activation, increased BDNF production, mTORC1 signaling activation, and rapid synaptogenesis — restoring synaptic connections in mood-regulating circuits degraded by chronic depression. This cascade begins within 4 hours. Esketamine also modulates the default mode network (DMN), reducing overactivity associated with rumination, and has demonstrated anti-inflammatory properties relevant to neuroinflammation in mood disorders.",
    evidence: [
      "TRANSFORM-2 (N=223): Significant MADRS score reduction at Day 28 (mean difference = -4.0; p=0.020) vs. placebo + oral AD. Popova et al., 2019, Am J Psychiatry.",
      "SUSTAIN-1 (N=297): Significantly longer time to relapse on esketamine vs. placebo. Daly et al., 2019, JAMA Psychiatry.",
      "ASPIRE I/II: Rapid reduction in depressive symptoms including suicidal ideation within 24 hours. Fu et al., 2020, BMJ.",
      "2025 FDA Monotherapy Approval: First and only monotherapy for TRD. 15% greater remission than placebo at 28 days; symptom improvement within 24 hours.",
      "Esketamine vs. Quetiapine (2023): 54% increased likelihood of remission at 8 weeks for TRD.",
      "Sexual Side Effects: <1% TESD vs. significant rates with SSRIs/SNRIs. Raza et al., 2025, Neuropsychiatr Dis Treat."
    ],
    synergies: "Spravato enhances outcomes layered onto existing CBT, DBT, and medication management. Its rapid onset (hours vs. weeks) creates a neuroplasticity window where patients become more receptive to psychotherapy. For residential/VIOP populations, patients plateaued on traditional ADs can experience rapid mood improvement, increasing engagement with group therapy, individual sessions, and skills practice. When paired with PGx testing, Spravato positions as a precision step-up for patients whose genetic profile indicates poor metabolism of first-line antidepressants.",
    contraindications: "Aneurysmal vascular disease (thoracic/abdominal aorta, intracranial, peripheral). Arteriovenous malformations. History of intracranial hemorrhage. Hypersensitivity to esketamine/ketamine. Elevated baseline BP >140/90 requires risk-benefit assessment. CNS depressants (benzos, opioids, alcohol) increase sedation risk. Psychostimulants and MAOIs may increase BP. Not recommended in pregnancy or breastfeeding. SUD history requires careful consideration per REMS."
  },
  {
    slId: 'tms',
    name: "TMS (Transcranial Magnetic Stimulation)",
    tier: "Tier 1", tierColor: "#7C3AED",
    classification: "FDA-cleared Class II medical device for neuromodulation",
    mechanism: "TMS uses a magnetic coil placed against the scalp to generate brief, focused magnetic pulses (~1.5 Tesla) that penetrate the skull and induce electrical currents in targeted cortical regions. For depression, high-frequency stimulation (10-20 Hz) of the left dorsolateral prefrontal cortex (DLPFC) is the standard protocol — this region is hypoactive in depressive states. Induced currents depolarize cortical neurons, triggering action potentials that propagate through connected neural circuits. Repeated stimulation over 4-6 weeks (20-36 sessions) induces LTP-like neuroplasticity — strengthening synaptic connections in mood-regulating circuits, normalizing prefrontal-limbic connectivity, and modulating serotonin, dopamine, and GABA systems. Low-frequency (1 Hz) right DLPFC stimulation also shows efficacy for depression and anxiety. Newer protocols include intermittent theta-burst stimulation (iTBS) achieving comparable effects in 3-minute vs. 37-minute sessions, and the Stanford SAINT protocol (multiple daily sessions over 5 days).",
    evidence: [
      "2024 NNDC Consensus Update: Reviewed 2,396 abstracts (2016-2024), confirming Level A evidence for HF left DLPFC stimulation. National Network of Depression Centers.",
      "Meta-analysis of 29 RCTs: 29.3% response and 18.6% remission with HF-rTMS vs. 10.4%/5% sham. Berlim et al., 2014.",
      "2022 Study: 63% of TRD patients responded to TMS; 42% reached full remission.",
      "Late-Life Depression (2025): Scoping review of 16 studies showed 20-63% remission rates. Bilateral and high-frequency protocols most effective.",
      "D-cycloserine Augmentation (2025): Remission in 9/12 MDD subjects with DCS + iTBS in only 20 sessions. DeMayo et al., 2025.",
      "OCD: FDA-cleared for OCD (2018), expanding the indication set beyond depression."
    ],
    synergies: "TMS is uniquely synergistic with psychotherapy — the neuroplasticity window enhances the brain's capacity to form new associations during CBT, CPT, and exposure therapy. For residential populations, the 36-session protocol (5 days/week, ~7 weeks) maps almost perfectly to residential LOS. TMS can be scheduled during the day while patients attend therapy groups morning and evening. Complementary to pharmacotherapy without pharmacokinetic interactions. For patients also receiving Spravato, TMS addresses different circuit targets (cortical stimulation vs. subcortical glutamatergic modulation), creating a multi-modal interventional approach.",
    contraindications: "Metallic implants in or near the head (excluding dental). History of seizures or epilepsy (relative). Implanted cardiac pacemakers or defibrillators. Cochlear implants. Intracranial pressure devices. Generally well-tolerated; common side effects include scalp discomfort and headache. Seizure risk is approximately 1 in 30,000 sessions."
  },
  {
    slId: 'pgx',
    name: "Pharmacogenomic (PGx) Testing",
    tier: "Tier 1", tierColor: "#6366F1",
    classification: "Precision medicine diagnostic tool (CLIA-certified laboratory test)",
    mechanism: "PGx testing analyzes genetic variations in drug-metabolizing enzymes (CYP2D6, CYP2C19, CYP2B6, CYP3A4), drug transporters, and pharmacodynamic targets (serotonin receptors, MTHFR) to predict metabolizer phenotype. Patients are classified as ultra-rapid, extensive (normal), intermediate, or poor metabolizers. Combinatorial algorithms (GeneSight, Tempus, Genomind) integrate multiple gene-drug interactions to categorize medications into advisory tiers: green (use as directed), yellow (use with caution), or red (use with increased caution). This identifies patients taking medications incongruent with their genetic profile — a common driver of treatment failure, adverse effects, and medication non-adherence.",
    evidence: [
      "GUIDED Trial (N=1,167): Largest patient/rater-blind RCT. Response rates 26.0% vs. 19.9% (p=0.013), remission 15.3% vs. 10.1% (p=0.007). Switching incongruent to congruent: 21.5% vs. 8.5% remission (p=0.007). Greden et al., 2019, J Psychiatr Res.",
      "PRIME Care (N=1,944): VA pragmatic RCT showed PGx-guided treatment led to modestly higher remission at 24 weeks. JAMA, 2022.",
      "Umbrella Review & Meta-Analysis (2024): Five RCTs showed 3.29% greater symptom improvement (p=0.02). GeneSight specifically: 3.95% (p=0.008). Tesfamicael et al., Frontiers in Psychiatry.",
      "Clinical Validity: Pooled analysis of 3 prospective trials — combinatorial PGx predicts poor outcomes better than single-gene phenotyping. Altar et al., 2015, Pharmacogenomics J.",
      "Rogers Behavioral Health (2026): Actively implementing PGx to reduce side effects and shorten time to therapeutic relief.",
      "Cost-Effectiveness: Ontario HTA found PGx cost-effective at $50K/QALY threshold when test price is ≤$2,162."
    ],
    synergies: "PGx is the ultimate force multiplier for existing medication management. By identifying genetically inappropriate medications at intake, clinicians avoid weeks of failed trials and adverse effects that undermine therapeutic engagement. Faster medication optimization means patients arrive at CBT/DBT sessions in a better neurochemical state to do the cognitive work. PGx results are lifetime — one test informs all future prescribing. Integration with ComplianceIQ documents PGx-informed decisions, strengthening medical necessity for payor review. The VBC narrative: 'We test at intake, prescribe genetically congruent medications from day one, and track the outcome delta.'",
    contraindications: "No clinical contraindications to the test itself. Limitations: PGx is one factor among many in medication response — clinical judgment remains primary. Results may not account for all drug-drug interactions, epigenetic factors, or non-genetic contributors to treatment response. Some payors have limited coverage."
  },
  {
    slId: 'ketamine',
    name: "IV/IM Ketamine Infusions",
    tier: "Tier 2", tierColor: "#F59E0B",
    classification: "Off-label use of FDA-approved anesthetic for psychiatric indications",
    mechanism: "Racemic (R,S)-ketamine is a noncompetitive NMDA receptor antagonist producing rapid antidepressant effects through a neurobiological cascade. By blocking NMDA receptors on GABAergic interneurons, ketamine disinhibits prefrontal glutamate release, creating a transient 'hyper-glutamatergic state.' This surge activates AMPA receptors, blocks extrasynaptic NMDA receptors, increases BDNF production, activates mTORC1 signaling, and triggers rapid synaptogenesis — reversing stress-induced prefrontal neuronal atrophy and synaptic disconnectivity. Ketamine also inhibits eEF2 (increasing BDNF translation), blocks NMDA-dependent burst firing in the lateral habenula (the brain's 'disappointment center'), has anti-inflammatory properties reducing neuroinflammation, and modulates the opioid system. Effects can begin within hours and the neuroplasticity response outlasts drug clearance.",
    evidence: [
      "Suicidal Ideation: Pooled meta-analysis (N=720) — robust effects on acute/postacute depression. MADRS SI item improved 64.7% at 24 hours. Wilkinson et al., 2018, Am J Psychiatry.",
      "Nationwide Cohort (N=514,988): Ketamine Rx associated with decreased SI risk: HR=0.63 at 1-7 days, sustained through 270 days. Nature Transl Psychiatry, 2024.",
      "TRD RCT (2024): Rapid and sustained effects on HAM-D17, BDI, MADRS at days 1, 3, 7. Zolghadriha et al., BMC Psychiatry.",
      "PTSD: Single infusion + exposure therapy enhanced post-retrieval extinction of traumatic memories with documented neural changes. Feder et al., Neuropsychopharmacology, 2023.",
      "Bipolar Depression: 71-79% response rate in crossover placebo-controlled trials.",
      "Market: U.S. ketamine clinics market $3.41B (2023), projected $6.9B by 2030 (CAGR 10-11%)."
    ],
    synergies: "Ketamine's rapid BDNF-mediated neuroplasticity creates a critical therapeutic window. When IV infusion is followed 24 hours later by CBT, CPT, or exposure therapy (at peak BDNF levels), patients show enhanced fear extinction and memory reconsolidation. This 'ketamine-assisted psychotherapy' model is a paradigm shift for PTSD-heavy residential populations. Complements Spravato (different isomer, route, context) and TMS (subcortical vs. cortical targets).",
    contraindications: "Uncontrolled hypertension. Active psychosis or schizophrenia. Elevated intracranial pressure. Pregnancy. History of hypersensitivity to ketamine. Caution in SUD populations (Schedule III). Requires hemodynamic monitoring during infusion. Dissociative symptoms are common but typically transient (resolve within 2-4 hours). Avoid in patients with unstable cardiovascular conditions."
  },
  {
    slId: 'sgb',
    name: "Stellate Ganglion Block (SGB)",
    tier: "Tier 2", tierColor: "#EF4444",
    classification: "Off-label use of established nerve block procedure for psychiatric indications",
    mechanism: "SGB involves injecting local anesthetic (typically bupivacaine) near the stellate ganglion — a sympathetic nerve bundle at C6-C7 — under ultrasound or fluoroscopic guidance (15-20 minutes). In PTSD, the sympathetic nervous system is chronically hyperactivated with excessive norepinephrine and 'nerve sprouting' (growth of additional sympathetic fibers maintaining fight-or-flight). SGB temporarily blocks sympathetic conduction, reducing brain norepinephrine, 'resetting' the SNS to pre-trauma baseline, reversing nerve sprouting through temporary denervation, and modulating the HPA axis through ascending regulation affecting the amygdala. Uniquely, SGB involves no psychoactive component — patients remain fully conscious and cogent. Effects can last months to years from 1-2 sessions.",
    evidence: [
      "Stella DSR Protocol (N=327): 81% reported meaningful PTSD relief; mean 28.9-point PCL decrease (10 points = clinically significant). 2016-2020 case series.",
      "RCT (2014): Significant PTSD symptom reduction vs. sham in military service members. Rae-Olmsted et al.",
      "Anxiety (N=285): Dual-level SGB reduces GAD-7 anxiety symptoms by 50%. 2023 case series.",
      "Walter Reed & VA System: SGB now provided at multiple military hospitals and VA facilities for treatment-resistant PTSD.",
      "Clinician Endorsement: Qualitative study (PMC, 2021) — behavioral health clinicians call SGB an 'invaluable adjunct' to trauma-focused therapy.",
      "Unique Advantage: 1-2 sessions vs. months for other modalities. No psychoactive component. Serious adverse events: 1 in 10,000."
    ],
    synergies: "SGB is the ideal physiological primer for trauma-focused therapy. By resetting the SNS, it reduces the hyperarousal that causes dropout from PE, CPT, and EMDR. Clinicians report faster engagement, lower dropout, and greater symptom reduction in patients who receive SGB before trauma processing. For residential populations, SGB can be administered on-site by a contracted anesthesiologist, followed immediately by intensive trauma therapy while the autonomic reset is active. Complementary to ketamine (peripheral sympathetic vs. central glutamatergic) and neurofeedback (SGB addresses arousal while NFB addresses brainwave regulation).",
    contraindications: "Anticoagulation therapy (bleeding risk at injection site). Local infection at injection site. Contralateral pneumothorax or phrenic nerve paralysis. Pathological bradycardia. Recent MI. Glaucoma (relative). Known allergy to local anesthetics. Common transient effects: Horner's syndrome (drooping eyelid, constricted pupil), hoarseness, warm sensation in arm — all resolve within hours."
  },
  {
    slId: 'neuro',
    name: "Neurofeedback (qEEG-Guided)",
    tier: "Tier 2", tierColor: "#ff6a5c",
    classification: "Non-invasive psychophysiological brain training intervention",
    mechanism: "Neurofeedback uses real-time EEG to measure ongoing brainwave activity, presented to the patient as visual/auditory feedback. Through operant conditioning, patients learn to produce desired brainwave patterns while reducing dysfunctional oscillations. In PTSD, the prefrontal cortex and hippocampus show decreased volume/activity while the amygdala becomes hyperactive — neurofeedback targets these dysregulated networks. qEEG-guided protocols use a quantitative brain map to identify specific deviations from normative databases, enabling individualized targeting. Protocols include alpha/theta training (trauma processing/relaxation), SMR training (attention/arousal regulation), and LORETA z-score neurofeedback (normalizing 3D brain activity). The mechanism relies on neuroplasticity — through 20-40 sessions, the brain self-regulates more effectively with changes persisting after treatment. Advanced approaches incorporate fMRI-guided targeting (amygdala-EFP) for spatial precision.",
    evidence: [
      "Meta-Analysis PTSD (2024): 17 RCTs, N=628 — significant PTSD symptom reduction with high quality of evidence. Voigt et al., Frontiers in Psychiatry.",
      "Clinical/Neurophysiological Meta-Analysis: SMD = -1.76 (95% CI -2.69 to -0.83); remission 79.3% NFB vs. 24.4% control. Askovic et al., European J Psychotraumatology, 2023.",
      "Depression Meta-Analysis: Hedges' g = 0.717 (p=0.0121) for bio/neurofeedback vs. control. Psychological Medicine, 2021.",
      "Van der Kolk Landmark RCT (2016): Significant PTSD symptom improvement and affect regulation. PLoS ONE.",
      "GAD: NFB training improved anxiety trait and depressive symptoms. Hou et al., Brain and Behavior, 2021.",
      "Neuroplasticity Evidence: Pre/post fMRI scans document measurable changes in brain connectivity and regional activation after NFB courses."
    ],
    synergies: "Neurofeedback addresses the neurophysiological substrate that makes psychotherapy effective. By training self-regulation, it enhances capacity for emotion regulation skills taught in DBT, mindfulness, and trauma processing. The 20-40 session protocol fits residential LOS perfectly and runs concurrently with existing programming. Non-invasive, non-pharmacological, and complements all other Nouveau modalities — alongside TMS (operant conditioning vs. direct stimulation), ketamine (NFB maintains gains between infusions), and SGB (NFB trains cortical regulation while SGB addresses autonomic arousal).",
    contraindications: "Very few. Not recommended for active seizure disorders without careful protocol design. Rare transient side effects include headache, fatigue, or transient increase in symptoms during training. No drug interactions. Safe across age ranges."
  },
  {
    slId: 'art',
    name: "Accelerated Resolution Therapy (ART)",
    tier: "Tier 2", tierColor: "#10B981",
    classification: "SAMHSA-recognized evidence-based psychotherapy for trauma",
    mechanism: "ART combines lateral eye movements (more directive than EMDR) with imagery rescripting to rapidly reprocess traumatic memories via memory reconsolidation — when actively recalled, memories enter a labile state where they can be modified before re-storage. The therapist guides voluntary lateral eye movements while the patient internally visualizes the traumatic event. Eye movements activate the parasympathetic nervous system (reducing arousal) and engage bilateral brain processing. The patient then 'rescripts' traumatic imagery — replacing distressing images with neutral or positive ones while factual memory remains intact. Critically, patients do not verbalize trauma aloud, reducing retraumatization risk and compassion fatigue. ART also incorporates Gestalt elements (themes, unfinished business, cognitive dissonance) and in-vitro exposure to future feared triggers.",
    evidence: [
      "RCT Combat PTSD (N=57): 3.7 sessions, 94% completion. PTSD, depression, anxiety, guilt significantly reduced (p<0.001) vs. attention control; persisted at 3-month follow-up including aggression (p<0.0001). Kip et al., Military Medicine, 2013.",
      "Complicated Grief RCT (N=54): Broad reductions in PTSD, grief, depressive symptoms in older adults. Buck et al., J Aging & Health, 2020.",
      "Cohort Studies: 80% positive response after <4 sessions average. Symptoms alleviated at 2+ month follow-up. Kip et al., 2012-2016.",
      "Recognition: SAMHSA evidence-based practice. APA Division 12 (Society of Clinical Psychology) recognizes ART as evidence-based for trauma.",
      "Ongoing Research: NIH-funded trial at Yale (HIV); Canadian Armed Forces study; University of Cincinnati RCT comparing ART to CPT (Sullivan Foundation funded).",
      "61% symptom reduction in PCL scores in veterans. Over 90% completion rate vs. higher dropout in traditional trauma therapies."
    ],
    synergies: "ART fills a critical gap for patients who haven't responded to or dropped out of CPT (12-20 sessions) or PE (36% veteran dropout rate). Its 1-5 session, non-verbal protocol is accessible for patients who resist talk-based trauma processing. Complements SGB beautifully — SGB resets autonomic arousal, then ART rescripts cognitive/emotional memories in the neuroplasticity window. Zero equipment cost; bills under standard psychotherapy codes (90834, 90837). Fastest, cheapest Nouveau addition with strong evidence.",
    contraindications: "Active psychosis. Severe dissociative disorders may require modified protocol. Active suicidal ideation with plan (stabilize first). Otherwise very well-tolerated with minimal adverse effects."
  },
  {
    slId: 'nad',
    name: "NAD+ IV Therapy",
    tier: "Tier 3", tierColor: "#EC4899",
    classification: "Off-label wellness/optimization infusion (not FDA-approved for psychiatric indications)",
    mechanism: "NAD+ (nicotinamide adenine dinucleotide) is a coenzyme in every cell, essential for converting nutrients into ATP through mitochondrial oxidative phosphorylation. NAD+ activates sirtuins ('longevity genes') involved in DNA repair, inflammation regulation, stress resistance, and cellular aging. In SUD, chronic substance exposure depletes NAD+ levels, impairing mitochondrial function, reducing ATP production, and dysregulating neurotransmitter synthesis (especially dopamine). IV administration bypasses digestion for maximum bioavailability. Proposed mechanisms: restoration of depleted neurotransmitter production, enhanced mitochondrial energy in brain reward circuits, sirtuin-mediated neuroinflammation reduction, calcium transport modulation affecting dopaminergic signaling.",
    evidence: [
      "SUD Case Series (N=50): IV NAD+ + enkephalinase inhibition significantly attenuated psychiatric burden in SUD. Blum et al., PMC, 2022.",
      "Animal Models: NAMPT contributes to cocaine reward through SIRT1 signaling in VTA. Singh et al., Int J Physiol Pathophysiol Pharmacol, 2019.",
      "Mitochondrial Function: NAD+ supplementation improves mitochondrial function and metabolic health. Zhu et al., Cell Metabolism, 2014.",
      "Cognitive Function: NAD+ replenishment improves cognition in aged mice. Hou et al., Neurobiology of Aging, 2015.",
      "IMPORTANT LIMITATIONS: 2022 JAMA Psychiatry commentary noted addiction recovery claims not yet supported by rigorous clinical data. Modern RCTs lacking. Most human evidence from oral precursors (NMN, NR), not IV. Biological plausibility is strong but clinical validation is nascent.",
      "Position as wellness optimization adjunct, not clinical treatment for regulatory safety."
    ],
    synergies: "Complements existing SUD treatment as a wellness optimization adjunct. May support neuronal recovery during residential treatment when combined with evidence-based therapies. Must be clearly positioned as supportive/restorative — not curative — to maintain regulatory and clinical integrity.",
    contraindications: "Generally well-tolerated. Side effects may include nausea, cramping, flushing during infusion (rate-dependent). Not recommended in pregnancy. Potential interaction with medications metabolized through NAD+-dependent pathways. Regulatory gray area — position as wellness, not clinical treatment."
  },
  {
    slId: 'hbot',
    name: "Hyperbaric Oxygen Therapy (HBOT)",
    tier: "Tier 3", tierColor: "#0891B2",
    classification: "FDA-approved medical device (off-label for neuropsychiatric conditions)",
    mechanism: "HBOT involves breathing 100% oxygen at 2.0 ATA in a pressurized chamber for 60-90 minutes per session. Elevated pressure dissolves 10-15x normal oxygen into blood plasma (independent of hemoglobin). In the brain, this triggers multiple neuroplasticity pathways: mitochondrial biogenesis (enhanced ATP, increased Bcl-2, reduced Bax), neurogenesis (Wnt-3 and VEGF/ERK upregulation in hippocampal dentate gyrus and subventricular zone), synaptogenesis (elevated GAP43 and synaptophysin), anti-inflammatory responses (reduced TNF-alpha and IL-6), angiogenesis, stem cell mobilization, and telomere elongation. For PTSD, HBOT restores brain metabolic function and circuit connectivity damaged by chronic stress, particularly in the orbitofrontal cortex, insula, and amygdala.",
    evidence: [
      "Sham-Controlled RCT for PTSD (2024): 56 veterans, 60 daily sessions. Significant brain connectivity improvement and PTSD symptom relief. Sustained at follow-up. Doenyas-Barak et al., J Clin Psychiatry.",
      "Threshold Effect (2025): Reanalysis showed sufficient treatment leads to sustained improvement; 2-year follow-up showed continued gains including reduced benzo/cannabis use. PMC, Brain and Behavior.",
      "Neuroplasticity in TBI (2024): RCT in children with PCS — improved cognition, memory, executive function with MRI-documented microstructural brain changes. Frontiers in Neurology.",
      "Systematic Review & Dosage Analysis (2024): Greatest PCL reduction (16.6 points, p<0.001) with standard 60-session/2 ATA protocol. Andrews & Harch, Frontiers in Neurology.",
      "$28M USF Clinical Trial (2024): Florida-funded 5-year RCT — most rigorous HBOT-TBI study to date. Results expected to reshape evidence landscape.",
      "Limitation: 2021 VA/DOD CPG recommends against HBOT for mild TBI based on 4 trials. PTSD-specific evidence is more promising but still emerging."
    ],
    synergies: "HBOT addresses the neuroinflammatory and metabolic damage underlying treatment resistance. The 60-session protocol (3 months daily) coordinates with residential LOS. A therapeutically significant side effect — re-emergence of traumatic memories during treatment — actually facilitates trauma processing when concurrent psychotherapy is provided. Complements all other Nouveau modalities by addressing the metabolic substrate (oxygen/mitochondrial) while others address circuit/receptor/behavioral layers.",
    contraindications: "Untreated pneumothorax (absolute). Upper respiratory infections, chronic sinusitis (relative — may cause barotrauma). Claustrophobia (relative). Certain chemotherapy agents (bleomycin, cisplatin). Seizure disorders (oxygen toxicity risk at higher pressures). Pregnancy. Ear/sinus barotrauma is the most common side effect."
  },
  {
    slId: 'peptides',
    name: "Peptide Therapy",
    tier: "Tier 3", tierColor: "#ff6a5c",
    classification: "Off-label functional medicine intervention (regulatory gray area)",
    mechanism: "Key peptides for behavioral health: BPC-157 (Body Protection Compound) — a gastric pentadecapeptide with neuroprotective/neurorestorative properties promoting VEGF-mediated angiogenesis, modulating dopaminergic/serotonergic pathways, with anxiolytic and antidepressant effects in preclinical models. Selank — synthetic tuftsin analog acting on GABA-A receptors, modulating BDNF expression, with demonstrated anxiolytic effects (approved in Russia for GAD), enhancing cognition without sedation. KPV (Lysine-Proline-Valine) — anti-inflammatory tripeptide reducing neuroinflammation through NF-kB inhibition. Semax — synthetic ACTH analog with nootropic/neuroprotective properties increasing BDNF and modulating serotonergic transmission (approved in Russia for anxiety, cognition, stroke).",
    evidence: [
      "BPC-157: Extensive preclinical evidence for neuroprotection, angiogenesis, and gut-brain axis modulation. Limited human clinical trial data.",
      "Selank: Human clinical trials in Russia demonstrating anxiolytic effects comparable to benzodiazepines without sedation or dependence. Approved for GAD in Russia.",
      "Semax: Clinical evidence for cognitive enhancement and anxiety reduction in Russian regulatory framework. Not replicated in Western trials.",
      "KPV: Preclinical anti-inflammatory evidence; human data limited to dermatological and GI applications.",
      "FDA Regulatory: Warning letters issued to compounding pharmacies marketing peptides for clinical use. Regulatory uncertainty ongoing.",
      "Position: Watch and build infrastructure. Science is compelling but regulatory/evidence landscape needs to mature before clinical deployment."
    ],
    synergies: "Peptide therapy represents the bleeding edge of functional psychiatry. If regulatory clarity emerges, peptides could complement existing treatments by addressing neuroinflammation (KPV), enhancing neuroplasticity (BPC-157/Semax BDNF effects), and providing non-sedating anxiolysis (Selank) without the dependency profile of benzodiazepines. For now, this is a future differentiator for the concierge/self-pay tier.",
    contraindications: "Regulatory gray area is the primary concern. Individual peptide safety profiles vary. BPC-157 has minimal reported adverse effects in animal studies. Selank/Semax have favorable safety profiles from Russian clinical use but lack Western regulatory approval. All require prescribing physician and compounding pharmacy relationship. Not recommended until regulatory landscape clarifies."
  }
];
