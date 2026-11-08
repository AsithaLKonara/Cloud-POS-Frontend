import { create } from 'zustand';

export type DialogType = 'alert' | 'confirm' | 'prompt';
export type DialogVariant = 'default' | 'danger' | 'warning' | 'info' | 'success';

export interface DialogOptions {
  type: DialogType;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'password' | 'email' | 'number';
}

interface GlobalDialogState {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmText: string;
  cancelText: string;
  defaultValue: string;
  placeholder: string;
  inputType: string;
  inputValue: string;
  resolvePromise: ((value: any) => void) | null;
  setInputValue: (val: string) => void;
  open: (options: DialogOptions) => Promise<any>;
  close: (result: boolean | string | null) => void;
}

export const useGlobalDialog = create<GlobalDialogState>((set, get) => ({
  isOpen: false,
  type: 'alert',
  title: '',
  message: '',
  variant: 'default',
  confirmText: 'Okay',
  cancelText: 'Cancel',
  defaultValue: '',
  placeholder: '',
  inputType: 'text',
  inputValue: '',
  resolvePromise: null,

  setInputValue: (inputValue: string) => set({ inputValue }),

  open: (options: DialogOptions) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        type: options.type,
        title: options.title,
        message: options.message,
        variant: options.variant || (options.type === 'confirm' ? 'default' : 'default'),
        confirmText: options.confirmText || (options.type === 'confirm' ? 'Confirm' : options.type === 'prompt' ? 'Submit' : 'Okay'),
        cancelText: options.cancelText || 'Cancel',
        defaultValue: options.defaultValue || '',
        placeholder: options.placeholder || '',
        inputType: options.inputType || 'text',
        inputValue: options.defaultValue || '',
        resolvePromise: resolve,
      });
    });
  },

  close: (result: boolean | string | null) => {
    const { resolvePromise } = get();
    if (resolvePromise) resolvePromise(result);
    set({ isOpen: false, resolvePromise: null, inputValue: '' });
  },
}));

export interface AlertOptions {
  variant?: DialogVariant;
  confirmText?: string;
}

export interface ConfirmOptions {
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

export interface PromptOptions {
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  inputType?: 'text' | 'password' | 'email' | 'number';
}

export const globalDialog = {
  alert: (message: string, title: string = "Notice", options?: AlertOptions): Promise<boolean> =>
    useGlobalDialog.getState().open({
      type: 'alert',
      title,
      message,
      variant: options?.variant || 'default',
      confirmText: options?.confirmText,
    }),

  confirm: (message: string, title: string = "Please Confirm", options?: ConfirmOptions): Promise<boolean> =>
    useGlobalDialog.getState().open({
      type: 'confirm',
      title,
      message,
      variant: options?.variant || 'default',
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
    }),

  prompt: (
    message: string,
    defaultValue: string = "",
    title: string = "Input Required",
    options?: PromptOptions
  ): Promise<string | null> =>
    useGlobalDialog.getState().open({
      type: 'prompt',
      title,
      message,
      defaultValue,
      placeholder: options?.placeholder,
      inputType: options?.inputType || 'text',
      variant: options?.variant || 'default',
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
    }),
};
