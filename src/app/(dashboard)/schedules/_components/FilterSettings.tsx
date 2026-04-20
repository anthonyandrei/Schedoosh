"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import DialogWrapper from "@/components/wrappers/GenericDialog";
import FilterForm from "./FilterForm";

const FilterSettings = () => {
  const [open, setOpen] = useState(false);

  return (
    <DialogWrapper
      title="Filter Settings"
      description="Here you can set your advanced filter before generating."
      open={open}
      setOpen={setOpen}
      isWide
      trigger={<Button variant="outline">Filter Settings</Button>}
      preventClickOutside
    >
      <FilterForm setOpen={setOpen} />
    </DialogWrapper>
  );
};

export default FilterSettings;
