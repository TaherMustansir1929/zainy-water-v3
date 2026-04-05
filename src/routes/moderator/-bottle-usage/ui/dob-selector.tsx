"use client";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

export const DobSelector = () => {
  const dob = useDOBStore((state) => state.dob);
  const setDOB = useDOBStore((state) => state.setDOB);

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="bottle-usage-date">
          Select Date of Bottle Usage
        </FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Popover>
            <PopoverTrigger
              className={"shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]"}
              render={
                <Button
                  id="bottle-usage-date"
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-normal shadow-sm sm:w-56"
                >
                  {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dob ?? undefined}
                onSelect={(date) => {
                  setDOB(date ?? null);
                }}
                defaultMonth={dob ?? new Date()}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            className="shadow-sm"
            onClick={() => {
              const today = new Date();
              setDOB(today);
            }}
          >
            Today
          </Button>
        </div>
      </Field>
    </FieldGroup>
  );
};
