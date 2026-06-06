-- AlterTable
ALTER TABLE `BusinessPlan` ADD COLUMN `actionPlan` TEXT NULL,
    ADD COLUMN `executiveSummary` TEXT NULL,
    ADD COLUMN `financialPlan` TEXT NULL,
    ADD COLUMN `marketAnalysis` TEXT NULL,
    ADD COLUMN `riskAnalysis` TEXT NULL,
    ADD COLUMN `scoreCapital` INTEGER NULL,
    ADD COLUMN `scoreMarket` INTEGER NULL,
    ADD COLUMN `scoreOverall` INTEGER NULL,
    ADD COLUMN `scoreSkill` INTEGER NULL,
    ADD COLUMN `strategyPlan` TEXT NULL;
