import { useState, useRef } from 'react'
import { API_BASE_URL } from '../config'

// Shared state and submit logic for the Login and Register forms.
// `fields` is the initial { fieldName: '' } state; `requiredFields` lists
// which of those must be non-empty before submitting.
function useAuthForm({ fields, requiredFields }) {
    const [values, setValues] = useState(fields)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    // A ref (not state) guards against overlapping submits: two submits
    // triggered in the same tick would both read stale state before either
    // re-render commits, but a ref update is visible immediately.
    const submittingRef = useRef(false)

    const setValue = (name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }))
    }

    // Validates required fields, then POSTs to `path` with the current
    // field values. `onSuccess(data)` runs after a successful response,
    // before the success message is set (e.g. to store a token).
    const submit = async (path, { successMessage, onSuccess } = {}) => {
        // Ignore a submit triggered while a previous one is still in
        // flight, so overlapping requests can't race and leave a stale
        // error/success message on screen.
        if (submittingRef.current) {
            return
        }

        for (const field of requiredFields) {
            if (!values[field]?.trim()) {
                setError(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`)
                return
            }
        }

        setError('')
        setSuccess('')
        submittingRef.current = true
        setIsSubmitting(true)

        try {
            const response = await fetch(`${API_BASE_URL}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.message)
                return
            }

            if (onSuccess) {
                onSuccess(data)
            }
            setSuccess(successMessage)
        } finally {
            submittingRef.current = false
            setIsSubmitting(false)
        }
    }

    return { values, setValue, error, success, isSubmitting, submit }
}

export default useAuthForm
