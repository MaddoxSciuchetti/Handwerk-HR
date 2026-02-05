import { fetchFileData, fetchProcessData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { File_Request, fileIcon, getFileName } from "../backround_worker";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { PDFViewer } from "@react-pdf/renderer";

import { Button } from "../ui/button";
import { api_Response, form_field } from "@/features/OnOf_Worker_Procedure";
import { success } from "zod";
import { useProcessData } from "@/contexts/ProcessDataContext";

export type UpdatedAiResponse = Omit<api_Response, "name"> & {
  user: {
    id: number;
    vorname: string;
    nachname: string;
  };
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#333333",
    marginBottom: 10,
  },
  info: {
    fontSize: 12,
    textAlign: "center",
    color: "#666666",
    marginBottom: 5,
  },
  content: {
    marginVertical: 20,
  },
  fieldContainer: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 1, // Fix for border style error
    borderStyle: "solid", // Define border style explicitly
    borderColor: "#cccccc", // Set the color for the border
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  fieldTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444444",
  },
  fieldText: {
    fontSize: 12,
    marginTop: 5,
    lineHeight: 1.6,
    color: "#333333",
  },
  fieldStatus: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: "bold",
    color: "#0056b3",
    backgroundColor: "#e0f7fa",
    padding: "3 6",
    borderRadius: 5,
    maxWidth: 100,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: 1,
    borderTopColor: "#cccccc",
    paddingTop: 10,
  },
  footerText: {
    textAlign: "center",
    fontSize: 10,
    color: "#666666",
  },
});

interface FileModalType {
  id: number;
  form_type: string;
  onClose: (val: boolean) => void;
}

export function FileModal({ id, onClose, form_type }: FileModalType) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading, error } = useProcessData(id, form_type);
  console.log("=== DATA === ");
  console.log(data);

  if (isLoading) {
    return (
      <div>
        <div
          onClick={() => onClose(false)}
          className="h-screen inset-0 fixed z-40 bg-black/60"
        ></div>
        <div className="absolute text-center items-center z-50 bg-gray-200 rounded-xl top-[20%] left-[50%] h-1/5 w-2xl -translate-x-1/2 -translate-y-1/2">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<MyDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `form-${id}-${new Date().toISOString().split("T")[0]}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("export faild", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (error) {
    return <div>Error loading data</div>;
  }

  const isoDate = new Date().toISOString();

  console.log("=== DATA ===");
  console.log(data);
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Arbeitsbericht</Text>
          <Text style={styles.subtitle}>
            Handwerker: {data?.user?.vorname} {data?.user?.nachname}
          </Text>
          <Text style={styles.info}>Datum: {isoDate}</Text>
          <Text style={styles.info}>Geschäftsführer: Timo Janik</Text>
        </View>

        <View style={styles.content}>
          {data?.form?.fields?.map((field: form_field, index) => (
            <View key={index} style={styles.fieldContainer}>
              <Text style={styles.fieldTitle}>
                Aufgabe {index + 1}: {field.description}
              </Text>
              <Text style={styles.fieldText}>Kommentar: {field.edit}</Text>
              <Text style={styles.fieldStatus}>Status: {field.status}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dokument wurde automatisch generiert.
          </Text>
        </View>
      </Page>
    </Document>
  );

  return (
    <>
      <div
        onClick={() => onClose(false)}
        className="h-screen inset-0 fixed z-60 bg-black/60"
      ></div>
      <div className="fixed z-50 flex items-center justify-center">
        <div className="bg-gray-200 rounded-xl max-w-2xl w-full mx-4 p-6 flex flex-col h-96">
          <PDFViewer className="flex-1 mb-4">
            <MyDocument />
          </PDFViewer>
          <Button
            variant={"outline"}
            className="hover:bg-gray-300"
            onClick={handleExport}
          >
            Exporieren
          </Button>
        </div>
      </div>
    </>
  );
}
