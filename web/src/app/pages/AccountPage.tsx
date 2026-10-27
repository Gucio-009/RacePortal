/**
 * AccountPage — pełna edycja danych konta, hasła i e-maila.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { KeyRound, Loader2, Mail, Shield, User, Phone, IdCard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AvatarPicker } from "../components/AvatarPicker";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { userInitials } from "../lib/types";
import {
  isStrongPassword,
  validateInstagramUrl,
  validatePersonName,
  validatePhone,
} from "../lib/profileValidation";

export function AccountPage() {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword, requestEmailChange } = useAuth();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [hasDrivingLicenseB, setHasDrivingLicenseB] = useState(false);
  const [hasPzmLicense, setHasPzmLicense] = useState(false);
  const [pzmLicense, setPzmLicense] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setAvatar(user?.avatar ?? "");
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setPhone(user?.phone ?? "");
    setAddress(user?.address ?? "");
    setInstagramUrl(user?.instagramUrl ?? "");
    setHasDrivingLicenseB(user?.hasDrivingLicenseB ?? false);
    setHasPzmLicense(Boolean(user?.pzmLicense));
    setPzmLicense(user?.pzmLicense ?? "");
  }, [user]);

  const roleLabel =
    user?.role === "ADMIN"
      ? t("roles.ADMIN_CAPS")
      : user?.role === "ORGANIZER"
        ? t("roles.ORGANIZER_CAPS")
        : t("roles.USER_CAPS");
  const isGoogleAccount = user?.googleAccount === true;

  const saveProfile = async () => {
    if (!username.trim() || username.trim().length < 2) {
      toast.error(t("validation.usernameMin"));
      return;
    }
    const nameErr =
      validatePersonName(firstName, t("account.firstName")) ||
      validatePersonName(lastName, t("account.lastName"));
    if (nameErr) {
      toast.error(nameErr);
      return;
    }
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }
    const igErr = validateInstagramUrl(instagramUrl);
    if (igErr) {
      toast.error(igErr);
      return;
    }
    setSavingProfile(true);
    const result = await updateProfile({
      username: username.trim(),
      avatar: avatar.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || "",
      instagramUrl: instagramUrl.trim() || "",
      hasDrivingLicenseB,
      pzmLicense: hasPzmLicense ? pzmLicense.trim() : "",
    });
    setSavingProfile(false);
    if (result.ok) {
      toast.success(t("account.savedOk"));
    } else {
      toast.error(result.message || t("account.saveFail"));
    }
  };

  const savePassword = async () => {
    if (!isStrongPassword(newPassword)) {
      toast.error(t("validation.strongPassword"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("account.passwordConfirmMismatch"));
      return;
    }
    setSavingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setSavingPassword(false);
    if (result.ok) {
      toast.success(t("account.passwordChanged"), {
        description: t("account.passwordChangedDesc"),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.message || t("account.passwordChangeFail"));
    }
  };

  const sendEmailChangeLink = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error(t("account.emailInvalid"));
      return;
    }
    if (trimmed === (user?.email ?? "").toLowerCase()) {
      toast.error(t("account.emailSame"));
      return;
    }
    if (!emailChangePassword) {
      toast.error(t("account.emailNeedPassword"));
      return;
    }
    setSavingEmail(true);
    const result = await requestEmailChange(trimmed, emailChangePassword);
    setSavingEmail(false);
    if (result.ok) {
      setEmailLinkSent(true);
      setEmailChangePassword("");
      toast.success(result.message || t("account.emailLinkOk"));
    } else {
      toast.error(result.message || t("account.emailLinkFail"));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--race-bg)]">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="text-[var(--race-accent)] font-display tracking-widest text-sm mb-2">
              {t("account.eyebrow")}
            </p>
            <h1 className="font-display text-[var(--race-fg)] mb-2" style={{ fontSize: "36px", fontWeight: 800 }}>
              {t("account.title")}
            </h1>
            <p className="text-[var(--race-muted)]">
              {isGoogleAccount ? t("account.subtitleGoogle") : t("account.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14 border-2 border-[var(--race-accent)]">
              <AvatarImage src={user?.avatar ?? undefined} />
              <AvatarFallback className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 800 }}>
                {userInitials(user ?? {})}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
                <Shield className="w-3 h-3 mr-1" />
                {roleLabel}
              </Badge>
              {user?.email ? (
                <p className="text-[var(--race-muted)] text-sm">{user.email}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
            <CardHeader>
              <CardTitle className="text-[var(--race-fg)] flex items-center gap-2 font-display">
                <User className="w-5 h-5 text-[var(--race-accent)]" />
                {t("account.profile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--race-fg)]">{t("account.username")}</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account-firstName" className="text-[var(--race-fg)]">
                    {t("account.firstName")}
                  </Label>
                  <Input
                    id="account-firstName"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={50}
                    autoComplete="given-name"
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-lastName" className="text-[var(--race-fg)]">
                    {t("account.lastName")}
                  </Label>
                  <Input
                    id="account-lastName"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={50}
                    autoComplete="family-name"
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-phone" className="text-[var(--race-fg)] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[var(--race-accent)]" />
                  {t("account.phone")}
                </Label>
                <Input
                  id="account-phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={16}
                  autoComplete="tel"
                  placeholder="+48 600 100 200"
                  className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                />
                <p className="text-xs text-[var(--race-muted)]">{t("account.phoneHint")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-address" className="text-[var(--race-fg)]">
                  {t("account.address")}
                </Label>
                <Input
                  id="account-address"
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("account.addressPlaceholder")}
                  autoComplete="street-address"
                  className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-instagram" className="text-[var(--race-fg)]">
                  {t("account.instagram")}
                </Label>
                <Input
                  id="account-instagram"
                  name="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/nazwa/"
                  className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                />
              </div>
              <div className="space-y-3 border border-[var(--race-border)] rounded-md p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-[var(--race-fg)] flex items-center gap-2">
                      <IdCard className="w-4 h-4 text-[var(--race-accent)]" />
                      {t("account.licenseB")}
                    </Label>
                  </div>
                  <Switch checked={hasDrivingLicenseB} onCheckedChange={setHasDrivingLicenseB} />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--race-border)]">
                  <div>
                    <Label className="text-[var(--race-fg)]">{t("account.pzm")}</Label>
                    <p className="text-xs text-[var(--race-muted)]">{t("account.pzmIndependent")}</p>
                  </div>
                  <Switch
                    checked={hasPzmLicense}
                    onCheckedChange={(v) => {
                      setHasPzmLicense(v);
                      if (!v) setPzmLicense("");
                    }}
                  />
                </div>
                {hasPzmLicense && (
                  <div className="space-y-2">
                    <Label className="text-[var(--race-fg)] text-sm">{t("account.pzmNumber")}</Label>
                    <Input
                      value={pzmLicense}
                      onChange={(e) => setPzmLicense(e.target.value)}
                      placeholder={t("account.pzmNumber")}
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--race-fg)]">{t("account.avatar")}</Label>
                <AvatarPicker
                  value={avatar}
                  onChange={setAvatar}
                  username={username}
                  firstName={firstName}
                  lastName={lastName}
                />
              </div>
              <Button
                onClick={saveProfile}
                disabled={savingProfile}
                className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
                style={{ fontWeight: 700 }}
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("account.saving")}
                  </>
                ) : (
                  t("account.saveData")
                )}
              </Button>
            </CardContent>
          </Card>

          {isGoogleAccount ? (
            <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
              <CardContent className="pt-6 space-y-2">
                <p className="text-[var(--race-fg)] font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[var(--race-accent)]" />
                  {t("account.googleLogin")}
                </p>
                <p className="text-[var(--race-muted)] text-sm">
                  {t("account.currentEmail", { email: user?.email ?? "" })}
                </p>
                <p className="text-[var(--race-muted)] text-sm">{t("account.googleEmailManaged")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
                <CardHeader>
                  <CardTitle className="text-[var(--race-fg)] flex items-center gap-2 font-display">
                    <Mail className="w-5 h-5 text-[var(--race-accent)]" />
                    {t("account.changeEmail")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[var(--race-muted)] text-sm">
                    {t("account.currentEmail", { email: user?.email ?? "" })}
                  </p>
                  <p className="text-[var(--race-muted)] text-sm">{t("account.emailChangeHint")}</p>
                  <div className="space-y-2">
                    <Label className="text-[var(--race-fg)]">{t("account.newEmail")}</Label>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setEmailLinkSent(false);
                      }}
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--race-fg)]">{t("account.currentPassword")}</Label>
                    <Input
                      type="password"
                      value={emailChangePassword}
                      onChange={(e) => setEmailChangePassword(e.target.value)}
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                      autoComplete="current-password"
                    />
                  </div>
                  {emailLinkSent && (
                    <p className="text-[var(--race-muted)] text-sm">{t("account.emailLinkSent")}</p>
                  )}
                  <Button
                    onClick={sendEmailChangeLink}
                    disabled={savingEmail}
                    className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
                    style={{ fontWeight: 700 }}
                  >
                    {savingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("account.sending")}
                      </>
                    ) : emailLinkSent ? (
                      t("account.resendLink")
                    ) : (
                      t("account.sendConfirmLink")
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
                <CardHeader>
                  <CardTitle className="text-[var(--race-fg)] flex items-center gap-2 font-display">
                    <KeyRound className="w-5 h-5 text-[var(--race-accent)]" />
                    {t("account.changePassword")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--race-fg)]">{t("account.currentPassword")}</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--race-fg)]">{t("account.newPassword")}</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                      autoComplete="new-password"
                    />
                    <p className="text-[var(--race-muted)] text-xs">{t("validation.strongPassword")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--race-fg)]">{t("account.confirmPassword")}</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    onClick={savePassword}
                    disabled={savingPassword}
                    className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
                    style={{ fontWeight: 700 }}
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("account.changing")}
                      </>
                    ) : (
                      t("account.changePasswordCta")
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {user?.role === "USER" && (
            <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
              <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-[var(--race-fg)] font-semibold mb-1">{t("account.becomeOrgTitle")}</p>
                  <p className="text-[var(--race-muted)] text-sm">{t("account.becomeOrgDesc")}</p>
                </div>
                <Link to="/zostan-organizatorem">
                  <Button
                    className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
                    style={{ fontWeight: 700 }}
                  >
                    {t("account.becomeOrgCta")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)]">
                {t("account.toDashboard")}
              </Button>
            </Link>
            <Link to="/ustawienia">
              <Button variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)]">
                {t("account.toSettings")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
