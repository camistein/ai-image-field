import {
  TextInput,
  Button,
  Flex,
  Card,
  Text,
  Spinner,
  useToast,
  Dialog,
  Box,
} from "@sanity/ui";
import {
  GenerateIcon,
  RefreshIcon,
  UploadIcon,
  CloseIcon,
} from "@sanity/icons";
import { useCallback, useState, ComponentType } from "react";
import {
  useClient,
  ImageValue,
  ObjectSchemaType,
  ObjectInputProps,
} from "sanity";
import { set } from "sanity";
import OpenAIGenerator from "./OpenAIGenerator";
import AIGeneratedImage from "./AIGeneratedImage";

export const AIImageInput: ComponentType<
  ObjectInputProps<ImageValue, ObjectSchemaType>
> = (props: ObjectInputProps<ImageValue>) => {
  const [aIImage, setAIImage] = useState<AIGeneratedImage | undefined>();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const onClose = useCallback(() => setOpen(false), []);
  const onOpen = useCallback(() => setOpen(true), []);

  const client = useClient({ apiVersion: "2025-08-21" });
  const toast = useToast();

  const generateAiImage = useCallback(async () => {
    setAIImage(undefined);

    if (!prompt.trim()) {
      toast.push({
        status: "error",
        title: "You have to enter a text to generate image",
      });
      return;
    }

    if (loading || !process.env.SANITY_STUDIO_OPENAI_API_KEY) return;

    setLoading(true);
    try {
      const generator = new OpenAIGenerator(
        process.env.SANITY_STUDIO_OPENAI_ORGANIZATION ?? "",
        process.env.SANITY_STUDIO_OPENAI_PROJECT ?? "",
        process.env.SANITY_STUDIO_OPENAI_API_KEY,
      );
      const image = await generator.generateImage(prompt, "1024x1024");
      if (image) {
        setAIImage(image);
        toast.push({
          status: "success",
          title: "Success!",
          description: `AI Image generated for ${prompt}`,
        });
      }
    } catch (error) {
      console.error(error);
      toast.push({
        status: "error",
        title: "Error when generating AI image!",
        description: `${error}`,
      });
    } finally {
      setLoading(false);
    }
  }, [prompt, loading, toast]);

  const saveImage = useCallback(async () => {
    if (!aIImage) return;

    setSaving(true);
    setPrompt("");
    try {
      const blob = aIImage.toBlob();
      const image = await client.assets.upload("image", blob, {
        filename: aIImage.fileNameWithGuid,
      });
      setAIImage(undefined);
      props.onChange(
        set({
          ...props.value,
          asset: { _ref: image._id, _type: "reference" },
        }),
      );
      setOpen(false);
    } catch (err) {
      toast.push({
        status: "error",
        title: "Error when saving AI image!",
        description: `${err}`,
      });
    } finally {
      setSaving(false);
    }
  }, [toast, client, aIImage, props]);

  const clearAIImage = useCallback(() => {
    setAIImage(undefined);
    setPrompt("");
    setLoading(false);
    setSaving(false);
  }, []);

  return (
    <div>
      {props.renderDefault(props)}
      <Flex paddingY={3}>
        <Card style={{ textAlign: "center" }}>
          <Button onClick={onOpen} text="Create AI Image" />
        </Card>
      </Flex>
      {open && (
        <Dialog
          header="Generate AI Image"
          id="generate-ai-image"
          onClose={onClose}
          zOffset={1000}
          width={"auto"}
        >
          <Box padding={4}>
            <Flex paddingY={3} direction={"column"} gap={4}>
              <TextInput
                placeholder="Describe image"
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.currentTarget.value);
                  setAIImage(undefined);
                }}
              />
              <div>
                <Button
                  icon={aIImage ? RefreshIcon : GenerateIcon}
                  text={loading ? "Loading" : "Generate image"}
                  disabled={loading || !prompt}
                  onClick={generateAiImage}
                  tone={!loading && !prompt ? "neutral" : "primary"}
                />
              </div>
              {loading && (
                <Flex paddingX={4} justify="center" align="center">
                  <Spinner muted />
                </Flex>
              )}
            </Flex>
            {aIImage && (
              <Card radius={2} shadow={1} style={{ overflow: "hidden" }}>
                <Flex padding={2}>
                  <Flex direction={"column"} gap={2}>
                    <img
                      style={{
                        maxWidth: "350px",
                        height: "auto",
                        width: "100%",
                      }}
                      src={`data:image/png;base64,${aIImage.b64}`}
                      width={aIImage.width}
                      height={aIImage.height}
                      alt="AI generated"
                    />
                    <Flex direction={"column"}>
                      <Card paddingTop={4}>
                        <Flex gap={3} direction={"column"}>
                          <Text>This image was generated for prompt:</Text>
                          <Text>
                            <i>{aIImage.name}</i>
                          </Text>
                        </Flex>
                      </Card>
                      <Card paddingTop={4}>
                        <Flex gap={3} direction={"row"}>
                          <Button
                            icon={UploadIcon}
                            text={saving ? "Saving" : "Use this image"}
                            disabled={saving}
                            style={{ cursor: "pointer" }}
                            onClick={saveImage}
                            tone={"positive"}
                          />
                          <Button
                            icon={CloseIcon}
                            text={"Remove"}
                            style={{ cursor: "pointer" }}
                            onClick={clearAIImage}
                            tone={"caution"}
                          />
                        </Flex>
                      </Card>
                    </Flex>
                  </Flex>
                </Flex>
              </Card>
            )}
          </Box>
        </Dialog>
      )}
    </div>
  );
};
