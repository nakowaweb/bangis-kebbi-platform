import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = { name: string; key: string; icon?: string };
type Lib = typeof import("country-state-city");

let libPromise: Promise<Lib> | null = null;
const loadLib = () => (libPromise ??= import("country-state-city"));

function useLib() {
  const [lib, setLib] = useState<Lib | null>(null);
  useEffect(() => {
    let alive = true;
    loadLib().then((mod) => alive && setLib(mod));
    return () => {
      alive = false;
    };
  }, []);
  return lib;
}

function SearchableSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  searchLabel,
  disabled,
  ariaLabel,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  searchLabel: string;
  disabled?: boolean | undefined;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.name === value);
  // Render at most 400 items at once so very long city lists stay fast; search narrows further.
  const [term, setTerm] = useState("");
  const visible = useMemo(() => {
    const q = term.trim().toLowerCase();
    const list = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
    return list.slice(0, 400);
  }, [options, term]);
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {selected?.icon ? <span className="mr-2" aria-hidden>{selected.icon}</span> : null}
              {value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={searchLabel} value={term} onValueChange={setTerm} />
            <CommandList>
              <CommandEmpty>No match found.</CommandEmpty>
              <CommandGroup>
                {visible.map((option) => (
                  <CommandItem
                    key={option.key}
                    value={option.key}
                    onSelect={() => {
                      onChange(option.name);
                      setTerm("");
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 size-4", value === option.name ? "opacity-100" : "opacity-0")} />
                    {option.icon ? <span className="mr-2" aria-hidden>{option.icon}</span> : null}
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}

function useCountries(lib: Lib | null) {
  return useMemo(
    () => (lib ? lib.Country.getAllCountries().map((c) => ({ name: c.name, isoCode: c.isoCode, flag: c.flag })) : []),
    [lib],
  );
}

/** Searchable list of every country with flags. Saves the country name. */
export function CountrySelect({ name, defaultValue, disabled }: { name: string; defaultValue?: string | undefined; disabled?: boolean | undefined }) {
  const lib = useLib();
  const countries = useCountries(lib);
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <SearchableSelect
      name={name}
      value={value}
      onChange={setValue}
      options={countries.map((c) => ({ name: c.name, key: c.isoCode, icon: c.flag }))}
      placeholder={lib ? "Select a country" : "Loading countries…"}
      searchLabel="Search countries…"
      disabled={disabled}
      ariaLabel="Country"
    />
  );
}

/**
 * Country → state/province/region → city, each a searchable list.
 * Region falls back to typing only when the country has no subdivision data;
 * city falls back to typing only when no city data exists for the selection.
 */
export function CountryRegionFields({
  countryName,
  regionName,
  cityName,
  defaultCountry,
  defaultRegion,
  defaultCity,
  disabled,
  countryLabel = "Country of residence",
  showLabels = true,
}: {
  countryName: string;
  regionName: string;
  cityName?: string;
  defaultCountry?: string;
  defaultRegion?: string;
  defaultCity?: string;
  disabled?: boolean | undefined;
  countryLabel?: string;
  showLabels?: boolean;
}) {
  const lib = useLib();
  const countries = useCountries(lib);
  const [country, setCountry] = useState(defaultCountry ?? "");
  const [region, setRegion] = useState(defaultRegion ?? "");
  const [city, setCity] = useState(defaultCity ?? "");

  const countryIso = countries.find((c) => c.name === country)?.isoCode;
  const regions = useMemo(() => {
    if (!lib || !countryIso) return [];
    return lib.State.getStatesOfCountry(countryIso).map((s) => ({ name: s.name, isoCode: s.isoCode }));
  }, [lib, countryIso]);
  const regionIso = regions.find((r) => r.name === region)?.isoCode;
  const cities = useMemo(() => {
    if (!lib || !countryIso) return [];
    const list = regionIso ? lib.City.getCitiesOfState(countryIso, regionIso) : regions.length === 0 ? lib.City.getCitiesOfCountry(countryIso) ?? [] : [];
    const seen = new Set<string>();
    return list.filter((c) => (seen.has(c.name) ? false : (seen.add(c.name), true))).map((c) => ({ name: c.name, key: `${c.stateCode}-${c.name}` }));
  }, [lib, countryIso, regionIso, regions.length]);

  const Label = ({ text }: { text: string }) => (showLabels ? <span className="text-sm font-medium leading-none">{text}</span> : null);

  return (
    <>
      <label className="grid gap-2">
        <Label text={countryLabel} />
        <SearchableSelect
          name={countryName}
          value={country}
          onChange={(next) => {
            if (next !== country) {
              setRegion("");
              setCity("");
            }
            setCountry(next);
          }}
          options={countries.map((c) => ({ name: c.name, key: c.isoCode, icon: c.flag }))}
          placeholder={lib ? "Select a country" : "Loading countries…"}
          searchLabel="Search countries…"
          disabled={disabled}
          ariaLabel={countryLabel}
        />
      </label>
      <label className="grid gap-2">
        <Label text="State / province / region" />
        {regions.length > 0 || !country ? (
          <SearchableSelect
            name={regionName}
            value={region}
            onChange={(next) => {
              if (next !== region) setCity("");
              setRegion(next);
            }}
            options={regions.map((r) => ({ name: r.name, key: r.isoCode }))}
            placeholder={country ? "Select a state or region" : "Select a country first"}
            searchLabel="Search states or regions…"
            disabled={disabled || !country}
            ariaLabel="State / province / region"
          />
        ) : (
          <Input
            name={regionName}
            value={region}
            aria-label="State / province / region"
            onChange={(event) => setRegion(event.target.value)}
            maxLength={120}
            placeholder="Type your state or region"
            disabled={disabled}
          />
        )}
      </label>
      {cityName ? (
        <label className="grid gap-2">
          <Label text="City" />
          {cities.length > 0 || !country || (regions.length > 0 && !region) ? (
            <SearchableSelect
              name={cityName}
              value={city}
              onChange={setCity}
              options={cities}
              placeholder={!country ? "Select a country first" : regions.length > 0 && !region ? "Select a state first" : "Select a city"}
              searchLabel="Search cities…"
              disabled={disabled || !country || (regions.length > 0 && !region)}
              ariaLabel="City"
            />
          ) : (
            <Input
              name={cityName}
              value={city}
              aria-label="City"
              onChange={(event) => setCity(event.target.value)}
              maxLength={80}
              placeholder="No city list available — type your city"
              disabled={disabled}
            />
          )}
        </label>
      ) : null}
    </>
  );
}
