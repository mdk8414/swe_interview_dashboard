type Q = { text: string; isCommon?: boolean };

export const behavioralSeed: Record<string, Q[]> = {
  Leadership: [
    { text: "Tell me about a time you led a team through ambiguity." },
    { text: "Describe a time you had to motivate a disengaged teammate." },
    { text: "Tell me about a time you had to make a decision without full information." },
    { text: "Describe a time you mentored someone." },
  ],
  Conflict: [
    { text: "Tell me about a time you had a disagreement with a coworker. How did you resolve it?" },
    { text: "Describe a time you pushed back on a manager's decision." },
    { text: "Tell me about a time two stakeholders wanted opposite things." },
  ],
  Failure: [
    { text: "Tell me about your biggest professional failure and what you learned." },
    { text: "Describe a time a project you owned missed its deadline." },
    { text: "Tell me about a bug you shipped to production. How did you handle it?" },
  ],
  Impact: [
    { text: "What's the project you're most proud of and why?" },
    { text: "Tell me about a time you made a measurable impact on the business." },
    { text: "Describe a technical decision that paid off long-term." },
  ],
  Teamwork: [
    { text: "Tell me about a time you collaborated with a difficult teammate." },
    { text: "Describe a time you had to work across multiple teams to ship something." },
    { text: "Tell me about a time you helped a teammate who was struggling." },
  ],
  Ambiguity: [
    { text: "Tell me about a time the requirements kept changing. How did you adapt?" },
    { text: "Describe a time you had to define the problem before you could solve it." },
    { text: "Tell me about a time you started a project without a clear spec." },
  ],
  Prioritization: [
    { text: "Tell me about a time you had too much on your plate. How did you prioritize?" },
    { text: "Describe a time you had to say no to a stakeholder." },
    { text: "Tell me about a time you had to cut scope to ship." },
  ],
  Disagreement: [
    { text: "Tell me about a time you disagreed with a technical approach. What did you do?" },
    { text: "Describe a time you were overruled. How did you respond?" },
    { text: "Tell me about a time you changed your mind after hearing a teammate's argument." },
  ],
  Learning: [
    { text: "Tell me about a time you had to learn a new technology quickly." },
    { text: "Describe the most useful piece of feedback you've received." },
    { text: "Tell me about a time you taught yourself something to unblock a project." },
  ],
  CustomerFocus: [
    { text: "Tell me about a time you advocated for the user/customer." },
    { text: "Describe a time you turned customer feedback into a product change." },
    { text: "Tell me about a time you discovered users were using your product unexpectedly." },
  ],
};
