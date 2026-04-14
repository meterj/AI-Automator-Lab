import React, { startTransition, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type SubscribeFormProps = {
  sourcePage: string;
  placeholder?: string;
  buttonLabel?: string;
};

const SubscribeForm: React.FC<SubscribeFormProps> = ({
  sourcePage,
  placeholder = 'Your work email',
  buttonLabel = 'Join the briefing',
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      startTransition(() => {
        setIsError(true);
        setMessage('Enter an email address first.');
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_BASE}/subscribers`, {
        email,
        sourcePage,
        referrer: window.location.href,
      });

      startTransition(() => {
        setIsError(false);
        setMessage(response.data.message || 'Subscription saved.');
        setEmail('');
      });
    } catch (error) {
      const fallbackMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Subscription failed.'
        : 'Subscription failed.';

      startTransition(() => {
        setIsError(true);
        setMessage(fallbackMessage);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="subscribe-form" onSubmit={handleSubmit}>
      <div className="closing-actions">
        <input
          type="email"
          placeholder={placeholder}
          aria-label="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : buttonLabel}
        </button>
      </div>
      <p className={isError ? 'subscribe-feedback is-error' : 'subscribe-feedback'}>
        {message || 'Get the top AI stories and analysis in one daily briefing.'}
      </p>
    </form>
  );
};

export default SubscribeForm;
