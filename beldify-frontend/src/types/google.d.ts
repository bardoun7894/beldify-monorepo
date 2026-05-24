// Type definitions for Google Identity Services
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdentityServicesConfig) => void;
        renderButton: (element: HTMLElement, options: GoogleRenderButtonOptions) => void;
        prompt: () => void;
        cancel: () => void;
      };
    };
  };
}

interface GoogleIdentityServicesConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  ux_mode?: 'popup' | 'redirect';
  login_uri?: string;
  native_callback?: any;
  itp_support?: boolean;
}

interface GoogleRenderButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number | string;
  locale?: string;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn' | 'btn_confirm' | 'btn_add_session' | 'btn_confirm_add_session';
  clientId: string;
}
