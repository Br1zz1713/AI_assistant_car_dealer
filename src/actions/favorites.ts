"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(carId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("You must be signed in to favorite cars");
    }

    // Check if already favorited
    const { data: existing } = await supabase
        .from("favorites")
        .select()
        .eq("user_id", user.id)
        .eq("car_id", carId)
        .single();

    if (existing) {
        // Remove if exists
        await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("car_id", carId);
    } else {
        // Add if not exists
        await supabase
            .from("favorites")
            .insert({ user_id: user.id, car_id: carId });
    }

    revalidatePath("/");
}
