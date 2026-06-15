export interface LetterData {
  template: "welcome" | "promotion" | "designation";
  subject: string;
  body: string;
  metadata: Record<string, any>;
}

export function generateWelcomeLetter(data: {
  name: string;
  membershipId: string;
  department: string;
  approvalDate: string;
}): LetterData {
  const date = new Date(data.approvalDate).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return {
    template: "welcome",
    subject: "Welcome to Mind Mesh Club!",
    body: `Dear ${data.name},

Congratulations! Your membership application has been approved.

Membership ID: ${data.membershipId}
Department: ${data.department}
Date of Approval: ${date}

You now have full access to:
- Member-only events and workshops
- Department-specific resources
- Club community and team directory

Welcome aboard!

Best regards,
Mind Mesh Club Administration`,
    metadata: { membershipId: data.membershipId, department: data.department },
  };
}

export function generatePromotionLetter(data: {
  name: string;
  previousRole: string;
  newRole: string;
  effectiveDate: string;
  approvedBy: string;
  permissions: string[];
}): LetterData {
  const date = new Date(data.effectiveDate).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return {
    template: "promotion",
    subject: `Promotion to ${data.newRole}`,
    body: `Dear ${data.name},

We are pleased to inform you that you have been promoted.

Previous Role: ${data.previousRole}
New Role: ${data.newRole}
Effective Date: ${date}
Approved by: ${data.approvedBy}

As a ${data.newRole}, you will have additional responsibilities and access to:
${data.permissions.map((p) => `- ${p}`).join("\n")}

Congratulations on this achievement!

Best regards,
Mind Mesh Club Administration`,
    metadata: { previousRole: data.previousRole, newRole: data.newRole },
  };
}

export function generateDesignationLetter(data: {
  name: string;
  designation: string;
  department: string;
  effectiveDate: string;
  approvedBy: string;
}): LetterData {
  const date = new Date(data.effectiveDate).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return {
    template: "designation",
    subject: `Designation Assigned: ${data.designation}`,
    body: `Dear ${data.name},

We are pleased to inform you that you have been assigned a new designation.

Designation: ${data.designation}
Department: ${data.department}
Effective Date: ${date}
Approved by: ${data.approvedBy}

This designation reflects your contributions and responsibilities within the club.

Best regards,
Mind Mesh Club Administration`,
    metadata: { designation: data.designation, department: data.department },
  };
}
