import { Button } from "@/components/ui/button";
import {
    deleteDescriptionData,
    fetchTaskData,
    TDescriptionData,
} from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

function DescriptionRoot() {
    const { data, error } = useQuery<TDescriptionData[]>({
        queryKey: ["description_root"],
        queryFn: fetchTaskData,
    });

    const { mutate: deleteDescription } = useMutation({
        mutationFn: deleteDescriptionData,
    });

    console.log(data);

    const [tab, setTab] = useState<"ONBOARDING" | "OFFBOARDING">("ONBOARDING");
    const OnboardingData = data?.filter(
        (value) => value.template_type === "ONBOARDING",
    );
    const OffboardingData = data?.filter(
        (value) => value.template_type === "OFFBOARDING",
    );

    return (
        <>
            <div>
                <Button
                    variant={tab === "ONBOARDING" ? "default" : "outline"}
                    className={
                        tab === "ONBOARDING"
                            ? "bg-gray-500 text-white"
                            : "bg-gray-200"
                    }
                    onClick={() => setTab("ONBOARDING")}
                >
                    Onboarding
                </Button>
                <Button
                    variant={tab === "OFFBOARDING" ? "default" : "outline"}
                    className={
                        tab === "OFFBOARDING"
                            ? "bg-gray-500 text-white"
                            : "bg-gray-200"
                    }
                    onClick={() => setTab("OFFBOARDING")}
                >
                    Offboarding
                </Button>
                <div>
                    {tab === "ONBOARDING"
                        ? OnboardingData?.map((item, index) => (
                              <div key={index}>
                                  <Button
                                      onClick={() =>
                                          deleteDescription(item.form_field_id)
                                      }
                                  >
                                      Delete Description
                                  </Button>
                                  <div className="outline">
                                      <div>{item.description}</div>
                                      <div>{item.owner}</div>
                                  </div>
                              </div>
                          ))
                        : OffboardingData?.map((item, index) => (
                              <div className="outline" key={index}>
                                  <Button
                                      onClick={() =>
                                          deleteDescription(item.form_field_id)
                                      }
                                  >
                                      Delete Description
                                  </Button>
                                  <div>{item.description}</div>
                                  <div>{item.owner}</div>
                              </div>
                          ))}
                </div>
            </div>
        </>
    );
}

export default DescriptionRoot;
