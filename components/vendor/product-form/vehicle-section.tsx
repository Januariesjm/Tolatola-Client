"use client"

import Image from "next/image"
import { ImageIcon, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ProductFormState } from "@/hooks/use-product-form"

/**
 * Vehicle and spare-part fields.
 *
 * Sliced verbatim from add-product-dialog.tsx, whose markup was byte-identical
 * to edit-product-dialog.tsx here. Takes the whole form state so the JSX did not
 * need rewriting, and renders its own visibility condition.
 */
export function ProductVehicleSection({ form }: { form: ProductFormState }) {
  const {
    brand,
    categories,
    compatibility,
    condition,
    engineSize,
    fuelType,
    isVehicles,
    mileage,
    model,
    name,
    partNumber,
    setBrand,
    setCompatibility,
    setCondition,
    setEngineSize,
    setFuelType,
    setMileage,
    setModel,
    setPartNumber,
    setTransmission,
    setVehicleSection,
    setYear,
    subCategoryId,
    transmission,
    vehicleSection,
    year,
  } = form

  return (
    <>
      {isVehicles && (
        <div className="border-t pt-4 mt-4 space-y-4 animate-in fade-in duration-300">
          <h4 className="font-bold text-sm text-stone-900">
            {(() => {
              const subCatName = categories.find((c) => c.id === subCategoryId)?.name
              const sectionLabel = vehicleSection === "vehicle" ? "Vehicle" : vehicleSection === "spare_part" ? "Spare Part" : ""
              if (subCatName && sectionLabel) return `${subCatName} / ${sectionLabel} Details`
              if (subCatName) return `${subCatName} Details`
              return "Vehicles / Spare Parts Details"
            })()}
          </h4>
          {/* Section is auto-derived from subcategory for the Vehicles category */}
          {vehicleSection ? (
            <div className="space-y-2">
              <Label>Section</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm text-stone-700">
                <span className="font-medium">{vehicleSection === "vehicle" ? "🚗 Vehicle" : "🔧 Spare Part"}</span>
                <span className="text-stone-400 text-xs">(derived from subcategory)</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Section *</Label>
              <Select value={vehicleSection} onValueChange={setVehicleSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="spare_part">Spare Part</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand / Make</Label>
              <Input placeholder="e.g. Toyota, Honda" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                  <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {vehicleSection === "vehicle" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input placeholder="e.g. Corolla, Civic" value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" placeholder="e.g. 2020" value={year} onChange={(e) => setYear(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mileage (km)</Label>
                  <Input type="number" placeholder="e.g. 50000" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Transmission</Label>
                  <Select value={transmission} onValueChange={setTransmission}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Engine Size</Label>
                  <Input placeholder="e.g. 2.0L, 1500cc" value={engineSize} onChange={(e) => setEngineSize(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {vehicleSection === "spare_part" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label>Spare Part Name *</Label>
                <Input placeholder="e.g. Brake Pad, Oil Filter, Chain" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Part Number</Label>
                  <Input placeholder="OEM / Manufacturer Part #" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Compatible Vehicles</Label>
                  <Input
                    placeholder="e.g. Toyota Corolla 2015-2020"
                    value={compatibility}
                    onChange={(e) => setCompatibility(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
