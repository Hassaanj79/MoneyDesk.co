
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRef, useState, useEffect } from "react"
// import { useNotifications } from "@/contexts/notification-context"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile, updateUserProfile } from "@/services/users"
import { updateProfile } from "firebase/auth"
import { toast } from "sonner"

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").optional(),
  email: z.string().email("Please enter a valid email address.").optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional(),
  photo: z.any().optional(),
})

export function ProfileForm() {
  const { user } = useAuth();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      street: "",
      state: "",
      zipcode: "",
    },
  });

  useEffect(() => {
    if (user) {
        setLoading(true);
        getUserProfile(user.uid).then(profile => {
            const defaultValues = {
                name: user.displayName || '',
                email: user.email || '',
                phone: '',
                street: '',
                state: '',
                zipcode: '',
            };

            if (profile) {
                form.reset({
                    name: profile.name || defaultValues.name,
                    email: profile.email || defaultValues.email,
                    phone: profile.phone || defaultValues.phone,
                    street: profile.street || defaultValues.street,
                    state: profile.state || defaultValues.state,
                zipcode: profile.zipcode || defaultValues.zipcode,
                });
                setPhotoPreview(profile.photoURL || user.photoURL || null);
            } else {
                 form.reset(defaultValues);
                setPhotoPreview(user.photoURL || null);
            }
        }).finally(() => setLoading(false));
    }
  }, [user, form]);

  
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user) return;
    setLoading(true);

    const { photo, ...profileData } = values;
    
    try {
        // Update Firestore profile
        await updateUserProfile(user.uid, {
            ...profileData,
            photoURL: photoPreview || null
        });

        // Update Firebase Auth user profile (including photoURL)
        await updateProfile(user, {
            displayName: values.name || user.displayName || '',
            photoURL: photoPreview || user.photoURL || null
        });

        // Country and currency are already synced in real-time via useEffect

        // Show success toast
        toast.success("Profile updated successfully!", {
            description: "Your profile information has been saved"
        });
        
        // Create notification (disabled)
        // addNotification({
        //   type: 'profile_updated',
        //   title: 'Profile Updated',
        //   message: 'Your profile has been updated successfully',
        //   navigationPath: '/settings',
        //   navigationParams: { tab: 'profile' },
        //   relatedEntityType: 'user'
        // });
    } catch (error) {
        console.error("Failed to update profile", error);
        
        // Show error toast
        toast.error("Failed to update profile", {
            description: "Could not update your profile. Please try again."
        });
    } finally {
        setLoading(false);
    }
  }
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
            form.setValue("photo", reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return <User className="h-10 w-10" />;
    const initials = name.split(' ').map(n => n[0]).join('');
    return initials.slice(0, 2);
  }


  if (loading) {
    return (
        <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 max-w-2xl">
        <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
               <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={photoPreview || undefined} alt="Avatar" data-ai-hint="person face" />
                <AvatarFallback>{getInitials(form.getValues('name'))}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                    <Camera className="mr-2 h-4 w-4" />
                    Change Photo
                </Button>
                <FormControl>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="sr-only"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Your email" 
                  {...field} 
                  value={field.value || ''} 
                  disabled
                  className="bg-muted"
                />
              </FormControl>
              <FormDescription>
                Email cannot be changed. Contact support if you need to update your email address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Your phone number" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. 123 Main St" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
                <FormItem>
                <FormLabel>City / State</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. San Francisco" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="zipcode"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Zip/Postal Code</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. 90210" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Profile
        </Button>
      </form>
    </Form>
  )
}
    