"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/dashboard/PageHeader";
import { useSettings, useUpdateSettings, useCreateSetting, useDeleteSetting } from "@/hooks/useSettings";
import { globalDialog } from "@/store/dialog.store";
import { Plus, Trash2 } from "lucide-react";

type SettingsFormData = Record<string, any>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { data: settingsArray, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const createSetting = useCreateSetting();
  const deleteSetting = useDeleteSetting();

  const { register, handleSubmit, reset } = useForm<SettingsFormData>();

  // State for adding a new custom setting
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("string");

  // Map settings array to an object for react-hook-form
  useEffect(() => {
    if (settingsArray) {
      const defaults: SettingsFormData = {};
      settingsArray.forEach((s) => {
        if (s.type === "boolean") {
          defaults[s.key] = s.value === "true";
        } else {
          defaults[s.key] = s.value;
        }
      });
      reset(defaults);
    }
  }, [settingsArray, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    // We only want to update the settings that exist in the form
    // Since RHF returns all registered fields, we map them back
    const updates = Object.entries(data).map(([key, value]) => ({
      key,
      value: typeof value === "boolean" ? (value ? "true" : "false") : String(value),
    }));

    try {
      await updateSettings.mutateAsync(updates);
      globalDialog.alert("Settings updated successfully!");
    } catch (err: any) {
      globalDialog.alert(err?.response?.data?.message || "Failed to update settings.");
    }
  };

  const handleCreateCustom = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      globalDialog.alert("Key and Value are required.");
      return;
    }
    
    // Check if key already exists in UI
    if (settingsArray?.some((s) => s.key === newKey.trim())) {
      globalDialog.alert("A setting with this key already exists.");
      return;
    }

    try {
      await createSetting.mutateAsync({
        key: newKey.trim(),
        value: newValue.trim(),
        type: newType,
        group: "custom",
        isPublic: false
      });
      setNewKey("");
      setNewValue("");
      globalDialog.alert("Custom setting added successfully!");
    } catch (err: any) {
      globalDialog.alert(err?.response?.data?.message || "Failed to add custom setting.");
    }
  };

  const handleDeleteCustom = async (key: string) => {
    if (confirm(`Are you sure you want to delete '${key}'?`)) {
      try {
        await deleteSetting.mutateAsync(key);
        globalDialog.alert("Setting deleted successfully!");
      } catch (err: any) {
        globalDialog.alert(err?.response?.data?.message || "Failed to delete setting.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  // Filter out the built-in groups so we only show remaining in Advanced
  const builtInKeys = [
    "store_name", "support_email", "support_phone", 
    "default_currency", "tax_rate", 
    "base_shipping_cost", 
    "enable_cod", "enable_card_payments",
    "email_new_orders", "email_low_stock"
  ];
  
  const customSettings = settingsArray?.filter(s => !builtInKeys.includes(s.key)) || [];

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full">
      <PageHeader 
        title="Global Settings" 
        description="Manage store configurations, regional settings, and integrations."
      />

      <div className="mt-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0 flex flex-col space-y-1">
          <button 
            onClick={() => setActiveTab("general")}
            className={`text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "general" ? "bg-primary text-white" : "text-muted hover:bg-surface-elevated hover:text-foreground"}`}
          >
            General Information
          </button>
          <button 
            onClick={() => setActiveTab("currency")}
            className={`text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "currency" ? "bg-primary text-white" : "text-muted hover:bg-surface-elevated hover:text-foreground"}`}
          >
            Currency & Tax
          </button>
          <button 
            onClick={() => setActiveTab("shipping")}
            className={`text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "shipping" ? "bg-primary text-white" : "text-muted hover:bg-surface-elevated hover:text-foreground"}`}
          >
            Shipping Settings
          </button>
          <button 
            onClick={() => setActiveTab("payment")}
            className={`text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "payment" ? "bg-primary text-white" : "text-muted hover:bg-surface-elevated hover:text-foreground"}`}
          >
            Payment Gateways
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "notifications" ? "bg-primary text-white" : "text-muted hover:bg-surface-elevated hover:text-foreground"}`}
          >
            Notifications
          </button>
          <button 
            onClick={() => setActiveTab("advanced")}
            className={`text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "advanced" ? "bg-primary text-white" : "text-muted hover:bg-surface-elevated hover:text-foreground"}`}
          >
            Advanced Custom Settings
          </button>
        </div>

        <div className="flex-1 bg-surface border border-border rounded-xl p-8 shadow-sm">
          {activeTab !== "advanced" ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              {activeTab === "general" && (
                <>
                  <h3 className="text-lg font-semibold font-poppins text-foreground mb-6">General Information</h3>
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Store Name</label>
                      <input 
                        type="text" 
                        {...register("store_name")}
                        className="w-full h-10 px-3 border border-border rounded-md outline-none focus:border-primary text-sm font-inter bg-background text-foreground" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Support Email</label>
                      <input 
                        type="email" 
                        {...register("support_email")}
                        className="w-full h-10 px-3 border border-border rounded-md outline-none focus:border-primary text-sm font-inter bg-background text-foreground" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Support Phone</label>
                      <input 
                        type="text" 
                        {...register("support_phone")}
                        className="w-full h-10 px-3 border border-border rounded-md outline-none focus:border-primary text-sm font-inter bg-background text-foreground" 
                      />
                    </div>
                    <div className="pt-4 border-t border-border flex justify-end">
                      <button type="submit" disabled={updateSettings.isPending} className="px-6 py-2 bg-primary hover:bg-primary-hover transition-colors text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                        {updateSettings.isPending ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "currency" && (
                <>
                  <h3 className="text-lg font-semibold font-poppins text-foreground mb-6">Currency & Tax</h3>
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Default Currency</label>
                      <select 
                        {...register("default_currency")}
                        className="w-full h-10 px-3 border border-border rounded-md outline-none focus:border-primary text-sm font-inter bg-background text-foreground"
                      >
                        <option value="LKR">Sri Lankan Rupee (LKR)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Tax Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        {...register("tax_rate")}
                        className="w-full h-10 px-3 border border-stone-300 rounded-md outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-sm font-inter" 
                      />
                    </div>
                    <div className="pt-4 border-t border-stone-100 flex justify-end">
                      <button type="submit" disabled={updateSettings.isPending} className="px-6 py-2 bg-stone-900 hover:bg-stone-800 transition-colors text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                        {updateSettings.isPending ? "Saving..." : "Save Settings"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "shipping" && (
                <>
                  <h3 className="text-lg font-semibold font-poppins text-stone-900 mb-6">Shipping Settings</h3>
                  <div className="space-y-6 max-w-2xl">
                    <p className="text-sm text-stone-500 font-inter">Configure default shipping rates and zones here.</p>
                    
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Base Shipping Cost (LKR)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        {...register("base_shipping_cost")}
                        className="w-full h-10 px-3 border border-stone-300 rounded-md outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-sm font-inter" 
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-stone-100 flex justify-end">
                      <button type="submit" disabled={updateSettings.isPending} className="px-6 py-2 bg-stone-900 hover:bg-stone-800 transition-colors text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                        Save
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "payment" && (
                <>
                  <h3 className="text-lg font-semibold font-poppins text-stone-900 mb-6">Payment Gateways</h3>
                  <div className="space-y-6 max-w-2xl">
                    <p className="text-sm text-stone-500 font-inter">Manage payment method integrations.</p>
                    
                    <label className="flex items-center gap-3 cursor-pointer p-4 border border-stone-200 rounded-lg">
                      <input 
                        type="checkbox" 
                        {...register("enable_cod")}
                        className="w-4 h-4 accent-stone-900" 
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-stone-900">Cash on Delivery (COD)</span>
                        <span className="text-xs text-stone-500">Allow customers to pay on delivery</span>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer p-4 border border-stone-200 rounded-lg">
                      <input 
                        type="checkbox" 
                        {...register("enable_card_payments")}
                        className="w-4 h-4 accent-stone-900" 
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-stone-900">Card Payments</span>
                        <span className="text-xs text-stone-500">Enable Visa, Mastercard processing</span>
                      </div>
                    </label>

                    <div className="pt-4 border-t border-stone-100 flex justify-end">
                      <button type="submit" disabled={updateSettings.isPending} className="px-6 py-2 bg-stone-900 hover:bg-stone-800 transition-colors text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                        Save
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "notifications" && (
                <>
                  <h3 className="text-lg font-semibold font-poppins text-stone-900 mb-6">Notification Preferences</h3>
                  <div className="space-y-6 max-w-2xl">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...register("email_new_orders")}
                        className="w-4 h-4 accent-stone-900" 
                      />
                      <span className="text-sm font-inter text-stone-700">Email alerts for new orders</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...register("email_low_stock")}
                        className="w-4 h-4 accent-stone-900" 
                      />
                      <span className="text-sm font-inter text-stone-700">Email alerts for low stock</span>
                    </label>

                    <div className="pt-4 border-t border-stone-100 flex justify-end">
                      <button type="submit" disabled={updateSettings.isPending} className="px-6 py-2 bg-stone-900 hover:bg-stone-800 transition-colors text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          ) : (
            <div>
              <h3 className="text-lg font-semibold font-poppins text-stone-900 mb-2">Advanced Custom Settings</h3>
              <p className="text-sm text-stone-500 font-inter mb-6">Dynamically add and manage custom configuration keys, API tokens, and integrations.</p>

              {/* Create new setting */}
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 mb-8">
                <h4 className="text-sm font-medium text-stone-900 mb-4">Add New Key-Value Pair</h4>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-stone-500 mb-1">Key (e.g. tracking_script)</label>
                    <input 
                      type="text" 
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="w-full h-10 px-3 border border-stone-300 rounded-md outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-sm font-inter" 
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-xs font-medium text-stone-500 mb-1">Value</label>
                    <input 
                      type="text" 
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="w-full h-10 px-3 border border-stone-300 rounded-md outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-sm font-inter" 
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-muted mb-1">Type</label>
                    <select 
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full h-10 px-3 border border-border rounded-md outline-none focus:border-primary text-sm font-inter bg-background text-foreground"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleCreateCustom}
                    disabled={createSetting.isPending}
                    className="h-10 px-4 bg-primary text-white text-sm font-medium rounded-md hover:bg-stone-800 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>

              {/* Existing custom settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-stone-900">Custom Entries</h4>
                {customSettings.length === 0 ? (
                  <p className="text-sm text-stone-500 italic">No custom settings configured yet.</p>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                      {customSettings.map((s) => (
                        <div key={s.key} className="flex gap-4 items-center">
                          <div className="flex-1">
                            <input 
                              type="text" 
                              value={s.key} 
                              readOnly 
                              className="w-full h-10 px-3 border border-stone-200 bg-stone-50 rounded-md text-sm font-inter text-stone-500 cursor-not-allowed" 
                            />
                          </div>
                          <div className="flex-[2]">
                            {s.type === "boolean" ? (
                              <div className="h-10 flex items-center px-3 border border-stone-300 rounded-md">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    {...register(s.key)}
                                    className="w-4 h-4 accent-stone-900" 
                                  />
                                  <span className="text-sm font-inter">{s.key} enabled</span>
                                </label>
                              </div>
                            ) : (
                              <input 
                                type="text" 
                                {...register(s.key)}
                                className="w-full h-10 px-3 border border-stone-300 rounded-md outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-sm font-inter" 
                              />
                            )}
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCustom(s.key)}
                            disabled={deleteSetting.isPending}
                            className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-stone-100 flex justify-end">
                        <button type="submit" disabled={updateSettings.isPending} className="px-6 py-2 bg-stone-900 hover:bg-stone-800 transition-colors text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                          {updateSettings.isPending ? "Saving..." : "Save Custom Settings"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
