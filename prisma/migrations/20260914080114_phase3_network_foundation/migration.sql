-- CreateEnum
CREATE TYPE "NetworkConnectionStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('SENT', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealCollaboratorRole" AS ENUM ('LISTING_BROKER', 'BUYER_BROKER', 'REFERRING_BROKER', 'CO_BROKER');

-- CreateEnum
CREATE TYPE "DealCollaboratorStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'REMOVED');

-- CreateEnum
CREATE TYPE "CommissionSplitStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "PropertyShareStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "Broker" ADD COLUMN     "networkOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "NetworkConnection" (
    "id" TEXT NOT NULL,
    "brokerAId" TEXT NOT NULL,
    "brokerBId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "NetworkConnectionStatus" NOT NULL DEFAULT 'REQUESTED',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderBrokerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referringBrokerId" TEXT NOT NULL,
    "referringPartnerId" TEXT NOT NULL,
    "receivingBrokerId" TEXT NOT NULL,
    "receivingPartnerId" TEXT NOT NULL,
    "sourceLeadId" TEXT,
    "clientSnapshotName" TEXT,
    "clientSnapshotPhone" TEXT,
    "clientSnapshotEmail" TEXT,
    "clientSnapshotBudget" DECIMAL(18,2),
    "requirementNotes" TEXT,
    "proposedSplitPercent" DECIMAL(5,2),
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedSplitPercent" DECIMAL(5,2),
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'SENT',
    "declineReason" TEXT,
    "resultingLeadId" TEXT,
    "resultingDealId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealCollaborator" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "role" "DealCollaboratorRole" NOT NULL,
    "splitPercent" DECIMAL(5,2),
    "status" "DealCollaboratorStatus" NOT NULL DEFAULT 'INVITED',
    "invitedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSplit" (
    "id" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "CommissionSplitStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyShare" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sharingBrokerId" TEXT NOT NULL,
    "sharedWithBrokerId" TEXT NOT NULL,
    "status" "PropertyShareStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PropertyShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerReview" (
    "id" TEXT NOT NULL,
    "reviewerBrokerId" TEXT NOT NULL,
    "revieweeBrokerId" TEXT NOT NULL,
    "dealId" TEXT,
    "referralId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NetworkConnection_brokerBId_status_idx" ON "NetworkConnection"("brokerBId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkConnection_brokerAId_brokerBId_key" ON "NetworkConnection"("brokerAId", "brokerBId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_brokerId_idx" ON "ConversationParticipant"("brokerId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_brokerId_key" ON "ConversationParticipant"("conversationId", "brokerId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_sourceLeadId_key" ON "Referral"("sourceLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_resultingLeadId_key" ON "Referral"("resultingLeadId");

-- CreateIndex
CREATE INDEX "Referral_referringBrokerId_status_idx" ON "Referral"("referringBrokerId", "status");

-- CreateIndex
CREATE INDEX "Referral_receivingBrokerId_status_idx" ON "Referral"("receivingBrokerId", "status");

-- CreateIndex
CREATE INDEX "DealCollaborator_dealId_status_idx" ON "DealCollaborator"("dealId", "status");

-- CreateIndex
CREATE INDEX "DealCollaborator_brokerId_status_idx" ON "DealCollaborator"("brokerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DealCollaborator_dealId_brokerId_key" ON "DealCollaborator"("dealId", "brokerId");

-- CreateIndex
CREATE INDEX "CommissionSplit_commissionId_status_idx" ON "CommissionSplit"("commissionId", "status");

-- CreateIndex
CREATE INDEX "CommissionSplit_brokerId_status_idx" ON "CommissionSplit"("brokerId", "status");

-- CreateIndex
CREATE INDEX "PropertyShare_sharedWithBrokerId_status_idx" ON "PropertyShare"("sharedWithBrokerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyShare_propertyId_sharedWithBrokerId_key" ON "PropertyShare"("propertyId", "sharedWithBrokerId");

-- CreateIndex
CREATE INDEX "BrokerReview_revieweeBrokerId_idx" ON "BrokerReview"("revieweeBrokerId");

-- CreateIndex
CREATE INDEX "BrokerReview_reviewerBrokerId_dealId_idx" ON "BrokerReview"("reviewerBrokerId", "dealId");

-- CreateIndex
CREATE INDEX "BrokerReview_reviewerBrokerId_referralId_idx" ON "BrokerReview"("reviewerBrokerId", "referralId");

-- CreateIndex
CREATE INDEX "Broker_networkOptIn_idx" ON "Broker"("networkOptIn");

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_brokerAId_fkey" FOREIGN KEY ("brokerAId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_brokerBId_fkey" FOREIGN KEY ("brokerBId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderBrokerId_fkey" FOREIGN KEY ("senderBrokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referringBrokerId_fkey" FOREIGN KEY ("referringBrokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referringPartnerId_fkey" FOREIGN KEY ("referringPartnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_receivingBrokerId_fkey" FOREIGN KEY ("receivingBrokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_receivingPartnerId_fkey" FOREIGN KEY ("receivingPartnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_sourceLeadId_fkey" FOREIGN KEY ("sourceLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_resultingLeadId_fkey" FOREIGN KEY ("resultingLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealCollaborator" ADD CONSTRAINT "DealCollaborator_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealCollaborator" ADD CONSTRAINT "DealCollaborator_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSplit" ADD CONSTRAINT "CommissionSplit_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSplit" ADD CONSTRAINT "CommissionSplit_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSplit" ADD CONSTRAINT "CommissionSplit_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSplit" ADD CONSTRAINT "CommissionSplit_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyShare" ADD CONSTRAINT "PropertyShare_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyShare" ADD CONSTRAINT "PropertyShare_sharingBrokerId_fkey" FOREIGN KEY ("sharingBrokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyShare" ADD CONSTRAINT "PropertyShare_sharedWithBrokerId_fkey" FOREIGN KEY ("sharedWithBrokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerReview" ADD CONSTRAINT "BrokerReview_reviewerBrokerId_fkey" FOREIGN KEY ("reviewerBrokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerReview" ADD CONSTRAINT "BrokerReview_revieweeBrokerId_fkey" FOREIGN KEY ("revieweeBrokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
