import { GuestOtpVerificationPage } from "@/features/events/components/public/guest-otp-verification-page";

export default async function VerifyGuestOtpPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return <GuestOtpVerificationPage publicId={publicId} />;
}
