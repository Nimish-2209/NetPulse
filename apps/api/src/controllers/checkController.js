import { Check } from "../models/index.js";

export async function listChecks(req, res) {
  const checks = await Check.find({
    teamId: req.params.teamId,
    serviceId: req.params.serviceId
  })
    .sort({ checkedAt: -1 })
    .limit(100);

  res.json({ checks });
}
