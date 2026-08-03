import type { ApiEvent } from "../../lib/types";
import { ALL_EVENT_CATEGORIES } from "../../lib/eventCategories";
import {
  OTHER,
  TRACK_PRESETS,
  START_TIMES,
  EVENT_IMAGE_PRESETS,
  ENTRY_FEE_PRESETS,
} from "../../lib/eventFormPresets";

export interface OrganizerEvent extends ApiEvent {
  _count?: { registrations: number };
}

export const emptyForm = {
  name: "",
  description: "",
  category: "",
  categoryOther: "",
  date: "",
  time: "10:00",
  timeOther: "",
  trackKey: "",
  trackOther: "",
  city: "",
  cityOther: "",
  voivodeship: "",
  imageUrl: "",
  imageCustom: false,
  lat: "",
  lng: "",
  paid: false,
  entryFee: "",
  entryFeeOther: false,
  bankAccount: "",
  paymentDeadlineHours: "72",
  freeCancelDays: "7",
  acceptRegistrations: true,
  endDate: "",
  endTime: "",
  spectatorFee: "",
  externalUrl: "",
  requireDrivingLicense: false,
  requirePzmLicense: false,
  requireOc: false,
  requirePt: false,
  requireCage: false,
  requireRegistered: false,
};

export type FormState = typeof emptyForm;

export function applyTrackPreset(prev: FormState, trackName: string): FormState {
  if (trackName === OTHER) {
    return { ...prev, trackKey: OTHER, city: "", cityOther: "", voivodeship: "", lat: "", lng: "" };
  }
  const preset = TRACK_PRESETS.find((t) => t.track === trackName);
  if (!preset) {
    return { ...prev, trackKey: trackName };
  }
  return {
    ...prev,
    trackKey: preset.track,
    trackOther: "",
    city: preset.city,
    cityOther: "",
    voivodeship: preset.voivodeship,
    lat: String(preset.lat),
    lng: String(preset.lng),
  };
}

export function eventToForm(event: ApiEvent): FormState {
  const categoryInList = ALL_EVENT_CATEGORIES.includes(event.category);
  const trackPreset = TRACK_PRESETS.find((t) => t.track === event.track);
  const timeInList = (START_TIMES as readonly string[]).includes(event.time);
  const imagePreset = EVENT_IMAGE_PRESETS.find((img) => img.url === event.imageUrl);
  const entryFeeStr = event.entryFee != null ? String(event.entryFee) : "";
  const entryFeeOther =
    Boolean(event.paid && entryFeeStr && !(ENTRY_FEE_PRESETS as readonly string[]).includes(entryFeeStr));

  let city = event.city;
  let cityOther = "";
  if (!trackPreset) {
    const cityInList = TRACK_PRESETS.some((t) => t.city === event.city);
    if (!cityInList) {
      city = OTHER;
      cityOther = event.city;
    }
  }

  return {
    name: event.name,
    description: event.description,
    category: categoryInList ? event.category : OTHER,
    categoryOther: categoryInList ? "" : event.category,
    date: event.date.slice(0, 10),
    time: timeInList ? event.time : OTHER,
    timeOther: timeInList ? "" : event.time,
    trackKey: trackPreset ? trackPreset.track : OTHER,
    trackOther: trackPreset ? "" : event.track,
    city,
    cityOther,
    voivodeship: event.voivodeship,
    imageUrl: event.imageUrl ?? "",
    imageCustom: Boolean(event.imageUrl && !imagePreset),
    lat: event.lat != null ? String(event.lat) : "",
    lng: event.lng != null ? String(event.lng) : "",
    paid: event.paid ?? false,
    entryFee: entryFeeStr,
    entryFeeOther,
    bankAccount: event.bankAccount ?? "",
    paymentDeadlineHours: String(event.paymentDeadlineHours ?? 72),
    freeCancelDays: String(event.freeCancelDays ?? 7),
    acceptRegistrations: event.acceptRegistrations ?? true,
    endDate: event.endDate?.slice(0, 10) ?? "",
    endTime: event.endTime ?? "",
    spectatorFee: event.spectatorFee != null ? String(event.spectatorFee) : "",
    externalUrl: event.externalUrl ?? "",
    requireDrivingLicense: event.requireDrivingLicense ?? false,
    requirePzmLicense: event.requirePzmLicense ?? false,
    requireOc: event.requireOc ?? false,
    requirePt: event.requirePt ?? false,
    requireCage: event.requireCage ?? false,
    requireRegistered: event.requireRegistered ?? false,
  };
}
