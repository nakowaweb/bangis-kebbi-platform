import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Country = { name: string; isoCode: string };
type Region = { name: string; isoCode: string };
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
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { name: string; key: string }[];
  placeholder: string;
  searchLabel: string;
  disabled?: boolean | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder={searchLabel} />
            <CommandList>
              <CommandEmpty>No match found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.key}
                    value={option.name}
                    onSelect={() => {
                      onChange(option.name);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 size-4", value === option.name ? "opacity-100" : "opacity-0")} />
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
  return useMemo<Country[]>(() => (lib ? lib.Country.getAllCountries().map((c) => ({ name: c.name, isoCode: c.isoCode })) : []), [lib]);
}

/** Searchable list of every country. Saves the country name. */
export function CountrySelect({ name, defaultValue, disabled }: { name: string; defaultValue?: string | undefined; disabled?: boolean | undefined }) {
  const lib = useLib();
  const countries = useCountries(lib);
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <SearchableSelect
      name={name}
      value={value}
      onChange={setValue}
      options={countries.map((c) => ({ name: c.name, key: c.isoCode }))}
      placeholder={lib ? "Select a country" : "Loading countries…"}
      searchLabel="Search countries…"
      disabled={disabled}
    />
  );
}

/** Country of residence plus the matching state / province / region list when one exists. */
export function CountryRegionFields({
  countryName,
  regionName,
  defaultCountry,
  defaultRegion,
  disabled,
}: {
  countryName: string;
  regionName: string;
  defaultCountry?: string;
  defaultRegion?: string;
  disabled?: boolean | undefined;
}) {
  const lib = useLib();
  const countries = useCountries(lib);
  const [country, setCountry] = useState(defaultCountry ?? "");
  const [region, setRegion] = useState(defaultRegion ?? "");

  const regions = useMemo<Region[]>(() => {
    const iso = countries.find((c) => c.name === country)?.isoCode;
    if (!lib || !iso) return [];
    return lib.State.getStatesOfCountry(iso).map((s) => ({ name: s.name, isoCode: s.isoCode }));
  }, [lib, countries, country]);

  return (
    <>
      <label className="grid gap-2">
        <span className="text-sm font-medium leading-none">Country of residence</span>
        <SearchableSelect
          name={countryName}
          value={country}
          onChange={(next) => {
            if (next !== country) setRegion("");
            setCountry(next);
          }}
          options={countries.map((c) => ({ name: c.name, key: c.isoCode }))}
          placeholder={lib ? "Select a country" : "Loading countries…"}
          searchLabel="Search countries…"
          disabled={disabled}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium leading-none">State / province / region</span>
        {regions.length > 0 ? (
          <SearchableSelect
            name={regionName}
            value={region}
            onChange={setRegion}
            options={regions.map((r) => ({ name: r.name, key: r.isoCode }))}
            placeholder="Select a state or region"
            searchLabel="Search states or regions…"
            disabled={disabled}
          />
        ) : (
          <Input
            name={regionName}
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            maxLength={120}
            placeholder={country ? "Type your state or region" : "Select a country first"}
            disabled={disabled || !country}
          />
        )}
      </label>
    </>
  );
}
